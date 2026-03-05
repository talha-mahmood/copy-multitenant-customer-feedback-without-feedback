import { Injectable, NotFoundException, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { Repository, LessThan, MoreThan, DataSource, IsNull } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';
import { WalletService } from '../wallets/wallet.service';
import { SuperAdminSettingsService } from '../super-admin-settings/super-admin-settings.service';
import { AdminWallet } from '../wallets/entities/admin-wallet.entity';
import { SuperAdminWallet } from '../wallets/entities/super-admin-wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CreateHomepageCouponRequestDto } from './dto/create-homepage-coupon-request.dto';
import { CreateHomepageAdRequestDto } from './dto/create-homepage-ad-request.dto';

@Injectable()
export class ApprovalService {
    constructor(
        @Inject('APPROVAL_REPOSITORY')
        private approvalRepository: Repository<Approval>,
        @Inject('MERCHANT_REPOSITORY')
        private merchantRepository: Repository<Merchant>,
        @Inject('MERCHANT_SETTING_REPOSITORY')
        private merchantSettingRepository: Repository<MerchantSetting>,
        @Inject(forwardRef(() => WalletService))
        private walletService: WalletService,
        private superAdminSettingsService: SuperAdminSettingsService,
        @Inject('DATA_SOURCE')
        private dataSource: DataSource,
    ) { }

    async create(createApprovalDto: Partial<Approval>): Promise<Approval> {
        const approval = this.approvalRepository.create(createApprovalDto);
        return await this.approvalRepository.save(approval);
    }

    async findAll(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async findOne(id: number): Promise<Approval> {
        const approval = await this.approvalRepository.findOne({
            where: { id },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });

        if (!approval) {
            throw new NotFoundException(`Approval with ID ${id} not found`);
        }

        return approval;
    }

    async findByMerchant(merchantId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { merchant_id: merchantId },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async findByAdmin(adminId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { admin_id: adminId },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async findByAgent(agentId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { agent_id: agentId },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async findPending(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: 'pending' },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async findApproved(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: 'approved' },
            relations: ['merchant', 'merchant.settings', 'admin', 'coupon', 'coupon.batch'],
        });
    }

    async update(id: number, updateApprovalDto: UpdateApprovalDto): Promise<Approval> {
        const approval = await this.findOne(id);
        const previousStatus = approval.approval_status;

        if (updateApprovalDto.merchant_id !== undefined) approval.merchant_id = updateApprovalDto.merchant_id;
        if (updateApprovalDto.approval_type !== undefined) approval.approval_type = updateApprovalDto.approval_type;
        if (updateApprovalDto.approval_owner !== undefined) approval.approval_owner = updateApprovalDto.approval_owner;
        if (updateApprovalDto.agent_id !== undefined) approval.agent_id = updateApprovalDto.agent_id;
        if (updateApprovalDto.request_from !== undefined) approval.request_from = updateApprovalDto.request_from;

        if (updateApprovalDto.approval_status !== undefined) {
            // Map boolean status to string if necessary
            if (typeof updateApprovalDto.approval_status === 'boolean') {
                approval.approval_status = updateApprovalDto.approval_status ? 'approved' : 'rejected';
            } else {
                approval.approval_status = updateApprovalDto.approval_status;
            }
        }

        if (updateApprovalDto.admin_id !== undefined) approval.admin_id = updateApprovalDto.admin_id;

        console.log(`[ApprovalService] Forced update for ${id}:`, {
            status: approval.approval_status,
            admin: approval.admin_id
        });

        await this.approvalRepository.update(id, {
            merchant_id: approval.merchant_id,
            approval_type: approval.approval_type,
            approval_owner: approval.approval_owner,
            agent_id: approval.agent_id,
            request_from: approval.request_from,
            approval_status: approval.approval_status,
            admin_id: approval.admin_id,
        });

        // RAW QUERY VERIFICATION (Bypass all caches)
        const raw = await this.approvalRepository.query('SELECT approval_status FROM approvals WHERE id = $1', [id]);
        console.log(`[ApprovalService] RAW DB VALUE for ${id}:`, raw[0]?.approval_status);

        const refetched = await this.findOne(id);
        if (previousStatus !== refetched.approval_status) {
            await this.handleApprovalSideEffects(refetched);
        }

        return refetched;
    }

    async remove(id: number): Promise<void> {
        const approval = await this.findOne(id);
        await this.approvalRepository.remove(approval);
    }

    async approve(id: number, adminId: number): Promise<Approval> {
        const approval = await this.findOne(id);

        // Check if this is a paid_ad approval
        if (approval.approval_type === 'paid_ad') {
            // Check if there are already 4 active paid ads for this admin
            const allActiveAds = await this.approvalRepository.find({
                where: {
                    admin_id: adminId,
                    approval_type: 'paid_ad',
                    approval_status: 'approved',
                },
            });

            // Filter to count only non-expired ads
            const currentDate = new Date();
            const nonExpiredAdsCount = allActiveAds.filter(ad => {
                if (!ad.ad_expired_at) return true;
                return new Date(ad.ad_expired_at) > currentDate;
            }).length;

            if (nonExpiredAdsCount >= 4) {
                throw new BadRequestException('There are not enough slots right now for the advertisement. Maximum 4 ads allowed per admin.');
            }

            // Fetch merchant settings to get duration and placement
            const merchantSettings = await this.merchantSettingRepository.findOne({
                where: { merchant_id: approval.merchant_id },
            });

            if (!merchantSettings) {
                throw new NotFoundException(`Merchant settings not found for merchant ID ${approval.merchant_id}`);
            }

            const now = new Date();
            const requestedStartDate = approval.ad_created_at ? new Date(approval.ad_created_at) : null;
            const adCreatedAt = requestedStartDate && requestedStartDate > now ? requestedStartDate : now;
            
            // Calculate ad_expired_at based on paid_ad_duration
            const duration = merchantSettings.paid_ad_duration || 7; // Default 7 days
            const adExpiredAt = new Date(adCreatedAt);
            adExpiredAt.setDate(adExpiredAt.getDate() + duration);

            // Get placement from merchant settings
            const placement = merchantSettings.paid_ad_placement || 'top';

            // Update approval with dates and placement
            approval.approval_status = 'approved';
            approval.admin_id = adminId;
            approval.ad_created_at = adCreatedAt;
            approval.ad_expired_at = adExpiredAt;
            approval.placement = placement;

            console.log(`[ApprovalService] Approving paid_ad ${id} with placement: ${placement}, expires at: ${adExpiredAt}`);
            
            await this.approvalRepository.update(id, {
                approval_status: 'approved',
                admin_id: adminId,
                ad_created_at: adCreatedAt,
                ad_expired_at: adExpiredAt,
                placement: placement,
            });
        } else {
            // For non paid_ad approvals, just update status
            approval.approval_status = 'approved';
            approval.admin_id = adminId;

            console.log(`[ApprovalService] Approving ${id}, new status: ${approval.approval_status}`);
            await this.approvalRepository.update(id, {
                approval_status: 'approved',
                admin_id: adminId
            });
        }

        // RAW QUERY VERIFICATION
        const raw = await this.approvalRepository.query('SELECT approval_status FROM approvals WHERE id = $1', [id]);
        console.log(`[ApprovalService] RAW DB VALUE after approve ${id}:`, raw[0]?.approval_status);

        const refetched = await this.findOne(id);
        await this.handleApprovalSideEffects(refetched);

        return refetched;
    }

    async reject(id: number, adminId: number): Promise<Approval> {
        const approval = await this.findOne(id);

        approval.approval_status = 'rejected';
        approval.admin_id = adminId;

        console.log(`[ApprovalService] Rejecting ${id}, new status: ${approval.approval_status}`);
        await this.approvalRepository.update(id, {
            approval_status: 'rejected',
            admin_id: adminId
        });

        // RAW QUERY VERIFICATION
        const raw = await this.approvalRepository.query('SELECT approval_status FROM approvals WHERE id = $1', [id]);
        console.log(`[ApprovalService] RAW DB VALUE after reject ${id}:`, raw[0]?.approval_status);

        const refetched = await this.findOne(id);
        await this.handleApprovalSideEffects(refetched);

        return refetched;
    }

    async getApprovedPaidAdds(adminId: number) {
        const currentDate = new Date();
        
        const approvals = await this.approvalRepository.find({
            where: {
                admin_id: adminId,
                approval_status: 'approved',
                approval_type: 'paid_ad',
            },
            relations: ['merchant', 'merchant.settings'],
        });

        // Filter out expired ads
        const activeApprovals = approvals.filter(approval => {
            if (approval.ad_created_at && new Date(approval.ad_created_at) > currentDate) {
                return false;
            }
            if (!approval.ad_expired_at) return true; // Include if no expiration date set
            return new Date(approval.ad_expired_at) > currentDate;
        });

        return activeApprovals.map((approval) => ({
            ...approval.merchant,
            paid_ad_image: approval.merchant?.settings?.paid_ad_image,
            paid_ad_placement: approval.placement || approval.merchant?.settings?.paid_ad_placement,
            paid_ad_video: approval.merchant?.settings?.paid_ad_video,
            ad_created_at: approval.ad_created_at,
            ad_expired_at: approval.ad_expired_at,
        }));
    }

    async getAvailablePlacements(adminId: number): Promise<string[]> {
        const allPlacements = ['top', 'bottom', 'left', 'right'];
        const currentDate = new Date();

        // Get all active (approved and not expired) paid ads for this admin
        const activeAds = await this.approvalRepository.find({
            where: {
                admin_id: adminId,
                approval_status: 'approved',
                approval_type: 'paid_ad',
            },
        });

        // Filter out expired ads and get their placements
        const occupiedPlacements = activeAds
            .filter(ad => {
                if (!ad.ad_expired_at) return true;
                return new Date(ad.ad_expired_at) > currentDate;
            })
            .map(ad => ad.placement)
            .filter(placement => placement); // Remove null/undefined

        // Return placements that are not occupied
        const availablePlacements = allPlacements.filter(
            placement => !occupiedPlacements.includes(placement)
        );

        return availablePlacements;
    }

    async getAvailablePlacementsSystemWide(): Promise<string[]> {
        const allPlacements = ['top', 'bottom', 'left', 'right'];
        const currentDate = new Date();

        // Get ALL active (approved and not expired) paid ads across entire system
        const activeAds = await this.approvalRepository.find({
            where: {
                approval_status: 'approved',
                approval_type: 'paid_ad',
            },
        });

        // Filter out expired ads and get their placements
        const occupiedPlacements = activeAds
            .filter(ad => {
                if (!ad.ad_expired_at) return true;
                return new Date(ad.ad_expired_at) > currentDate;
            })
            .map(ad => ad.placement)
            .filter(placement => placement); // Remove null/undefined

        // Return placements that are not occupied
        const availablePlacements = allPlacements.filter(
            placement => !occupiedPlacements.includes(placement)
        );

        return availablePlacements;
    }

    async getAvailablePlacementsForMerchant(merchantId: number): Promise<string[]> {
        // First, get the merchant to find their admin_id
        const merchant = await this.merchantRepository.findOne({
            where: { id: merchantId },
        });

        if (!merchant) {
            throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
        }

        if (!merchant.admin_id) {
            throw new NotFoundException(`Merchant ${merchantId} does not have an assigned admin`);
        }

        // Return available placements for the merchant's admin (per-admin basis)
        return this.getAvailablePlacements(merchant.admin_id);
    }

    private async handleApprovalSideEffects(approval: Approval): Promise<void> {
        try {
            console.log(`[ApprovalService] Handling side effects for type: ${approval.approval_type}, status: ${approval.approval_status}`);
            if (approval.approval_type === 'paid_ad') {
                const now = new Date();
                const startsAt = approval.ad_created_at ? new Date(approval.ad_created_at) : now;
                const isActive = approval.approval_status === 'approved' && startsAt <= now;

                console.log(`[ApprovalService] Updating merchant ${approval.merchant_id} settings.paid_ads to ${isActive}`);
                await this.merchantSettingRepository.update(
                    { merchant_id: approval.merchant_id },
                    { paid_ads: isActive }
                );

                console.log(`[ApprovalService] Updating merchant ${approval.merchant_id} paid_ads to ${isActive}`);
                await this.merchantRepository.update(
                    { id: approval.merchant_id },
                    { paid_ads: isActive }
                );
            }
        } catch (error) {
            console.error('[ApprovalService] Error in handleApprovalSideEffects:', error);
            // We don't throw here to avoid rolling back the main approval status change
        }
    }

    // ============ HOMEPAGE PUSH METHODS (Phase 2) ============

    async createHomepageCouponRequest(
        merchantId: number,
        dto: CreateHomepageCouponRequestDto,
    ): Promise<Approval> {
        // Verify merchant exists
        const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
        }

        const couponRepository = this.dataSource.getRepository(Coupon);
        let resolvedCouponId = dto?.coupon_id;
        let resolvedBatchId = dto?.coupon_batch_id;

        if (resolvedCouponId) {
            const selectedCoupon = await couponRepository.findOne({
                where: {
                    id: resolvedCouponId,
                    merchant_id: merchantId,
                },
            });

            if (!selectedCoupon) {
                throw new NotFoundException('Selected coupon not found for this merchant');
            }

            resolvedBatchId = selectedCoupon.batch_id;
        }

        if (!resolvedCouponId && resolvedBatchId) {
            const representativeCoupon = await couponRepository.findOne({
                where: {
                    merchant_id: merchantId,
                    batch_id: resolvedBatchId,
                },
                order: { id: 'ASC' },
            });

            if (!representativeCoupon) {
                throw new NotFoundException('No coupons found for selected coupon batch');
            }

            resolvedCouponId = representativeCoupon.id;
            resolvedBatchId = representativeCoupon.batch_id;
        }

        if (!resolvedCouponId || !resolvedBatchId) {
            throw new BadRequestException('Either coupon_id or coupon_batch_id is required');
        }

        const batchAlreadyActiveOnHomepage = await this.isCouponBatchAlreadyActiveOnHomepage(resolvedBatchId);
        if (batchAlreadyActiveOnHomepage) {
            throw new BadRequestException('This coupon batch is already placed on superadmin homepage');
        }

        const duplicatePendingOrApprovedRequest = await this.approvalRepository
            .createQueryBuilder('approval')
            .innerJoin('approval.coupon', 'coupon')
            .where('approval.merchant_id = :merchantId', { merchantId })
            .andWhere('approval.approval_type = :approvalType', { approvalType: 'homepage_coupon_push' })
            .andWhere('coupon.batch_id = :batchId', { batchId: resolvedBatchId })
            .andWhere('approval.approval_status NOT IN (:...allowedStatuses)', {
                allowedStatuses: ['disapproved_by_agent', 'rejected_by_superadmin', 'rejected'],
            })
            .orderBy('approval.created_at', 'DESC')
            .getOne();

        if (duplicatePendingOrApprovedRequest) {
            throw new BadRequestException(
                'You already have a request for this coupon batch.',
            );
        }

        const requestedStartDate = this.resolveHomepagePlacementStartDate(dto?.start_date);

        // Create approval request
        const approval = this.approvalRepository.create({
            merchant_id: merchantId,
            agent_id: merchant.admin_id,
            approval_type: 'homepage_coupon_push',
            approval_owner: 'super_admin',
            request_from: 'merchant',
            approval_status: 'pending_agent_review',
            coupon_id: resolvedCouponId,
            forwarded_by_agent: false,
            payment_status: 'pending',
            couponbatch_created_at: requestedStartDate,
        });

        return await this.approvalRepository.save(approval);
    }

    async createHomepageAdRequest(merchantId: number, dto: CreateHomepageAdRequestDto): Promise<Approval> {
        // Verify merchant exists
        const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
        }

        const adPlacement = dto?.ad_placement;
        const normalizedPlacement = this.normalizeRequestedHomepageAdPlacement(adPlacement);
        if (!normalizedPlacement) {
            throw new BadRequestException('Ad placement must be one of: top, bottom, left, right');
        }

        const requestedStartDate = this.resolveHomepagePlacementStartDate(dto?.start_date);

        // const merchantSettings = await this.merchantSettingRepository.findOne({
        //     where: { merchant_id: merchantId },
        // });

        // const hasAdMedia = Boolean(
        //     merchantSettings?.paid_ad_image ||
        //     merchantSettings?.paid_ad_video ||
        //     merchant?.paid_ad_image,
        // );

        // if (!hasAdMedia) {
        //     throw new BadRequestException(
        //         'Please upload ad image or ad video in merchant settings before requesting homepage ad placement.',
        //     );
        // }

        // Create approval request
        const approval = this.approvalRepository.create({
            merchant_id: merchantId,
            agent_id: merchant.admin_id,
            approval_type: 'homepage_ad_push',
            approval_owner: 'super_admin',
            request_from: 'merchant',
            approval_status: 'pending_agent_review',
            ad_type: normalizedPlacement,
            forwarded_by_agent: false,
            payment_status: 'pending',
            ad_created_at: requestedStartDate,
        });

        return await this.approvalRepository.save(approval);
    }

    async forwardToSuperAdmin(approvalId: number, agentId: number): Promise<Approval> {
        const approval = await this.findOne(approvalId);

        // Verify approval is pending agent review
        if (approval.approval_status !== 'pending_agent_review') {
            throw new BadRequestException('Only pending requests can be forwarded');
        }

        // Verify agent owns this merchant
        if (approval.agent_id !== agentId) {
            throw new BadRequestException('You can only forward requests from your own merchants');
        }

        // Update approval
        approval.approval_status = 'forwarded_to_superadmin';
        approval.forwarded_by_agent = true;
        approval.admin_id = agentId;

        await this.approvalRepository.update(approvalId, {
            approval_status: 'forwarded_to_superadmin',
            forwarded_by_agent: true,
            admin_id: agentId,
        });

        return await this.findOne(approvalId);
    }

    async disapproveByAgent(approvalId: number, agentId: number, reason: string): Promise<Approval> {
        const approval = await this.findOne(approvalId);

        // Verify approval is pending agent review
        if (approval.approval_status !== 'pending_agent_review') {
            throw new BadRequestException('Only pending requests can be disapproved');
        }

        // Verify agent owns this merchant
        if (approval.agent_id !== agentId) {
            throw new BadRequestException('You can only disapprove requests from your own merchants');
        }

        // Update approval
        approval.approval_status = 'disapproved_by_agent';
        approval.disapproval_reason = reason;

        await this.approvalRepository.update(approvalId, {
            approval_status: 'disapproved_by_agent',
            disapproval_reason: reason,
        });

        return await this.findOne(approvalId);
    }

    async getPendingRequestsForAgent(agentId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: {
                agent_id: agentId,
                approval_status: 'pending_agent_review',
            },
            relations: ['merchant', 'merchant.settings', 'coupon', 'coupon.batch'],
            order: { created_at: 'DESC' },
        });
    }

    async getForwardedRequestsForSuperAdmin(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: {
                approval_status: 'forwarded_to_superadmin',
                forwarded_by_agent: true,
            },
            relations: ['merchant', 'merchant.settings', 'merchant.admin', 'merchant.admin.user', 'admin', 'admin.user', 'coupon', 'coupon.batch'],
            order: { updated_at: 'DESC' },
        });
    }

    // ============ PHASE 3: SUPER ADMIN APPROVAL & PAYMENT ============

    async approveBySuperAdmin(approvalId: number): Promise<Approval> {
        const approval = await this.findOne(approvalId);

        // Verify approval is forwarded
        if (approval.approval_status !== 'forwarded_to_superadmin') {
            throw new BadRequestException('Only forwarded requests can be approved');
        }

        // Check available slots
        const settings = await this.superAdminSettingsService.getSettings();
        const isCoupon = approval.approval_type === 'homepage_coupon_push';

        if (isCoupon && approval.coupon?.batch_id) {
            const batchAlreadyActive = await this.isCouponBatchAlreadyActiveOnHomepage(
                approval.coupon.batch_id,
                approval.id,
            );

            if (batchAlreadyActive) {
                throw new BadRequestException(
                    'This coupon batch is already placed on superadmin homepage and cannot be placed again.',
                );
            }
        }

        const maxSlots = isCoupon ? settings.max_homepage_coupons : settings.max_homepage_ads;

        const activeCount = await this.getActiveHomepagePlacementsCount(approval.approval_type);
        if (activeCount >= maxSlots) {
            throw new BadRequestException(`No available slots. Maximum ${maxSlots} ${isCoupon ? 'coupons' : 'ads'} allowed`);
        }

        // Get pricing
        const cost = isCoupon 
            ? settings.homepage_coupon_placement_cost 
            : settings.homepage_ad_placement_cost;

        // Update approval
        await this.approvalRepository.update(approvalId, {
            approval_status: 'approved_pending_payment',
            payment_amount: cost,
        });

        return await this.findOne(approvalId);
    }

    async rejectBySuperAdmin(approvalId: number, reason: string): Promise<Approval> {
        const approval = await this.findOne(approvalId);

        // Verify approval is forwarded
        if (approval.approval_status !== 'forwarded_to_superadmin') {
            throw new BadRequestException('Only forwarded requests can be rejected');
        }

        // Update approval
        await this.approvalRepository.update(approvalId, {
            approval_status: 'rejected_by_superadmin',
            disapproval_reason: reason,
        });

        return await this.findOne(approvalId);
    }

    async processHomepagePlacementPayment(
        approvalId: number,
        paymentIntentId: string,
    ): Promise<Approval> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const approval = await this.findOne(approvalId);

            // Verify status
            if (approval.approval_status !== 'approved_pending_payment') {
                throw new BadRequestException('Approval not ready for payment');
            }

            if (approval.approval_type === 'homepage_coupon_push' && approval.coupon?.batch_id) {
                const batchAlreadyActive = await this.isCouponBatchAlreadyActiveOnHomepage(
                    approval.coupon.batch_id,
                    approval.id,
                );

                if (batchAlreadyActive) {
                    throw new BadRequestException(
                        'This coupon batch is already placed on superadmin homepage and cannot be placed again.',
                    );
                }
            }

            // Get merchant and agent
            const merchant = await queryRunner.manager.findOne(Merchant, {
                where: { id: approval.merchant_id },
            });
            if (!merchant || !merchant.admin_id) {
                throw new NotFoundException('Merchant or agent not found');
            }

            // Get agent wallet
            const agentWallet = await queryRunner.manager.findOne(AdminWallet, {
                where: { admin_id: merchant.admin_id },
            });
            if (!agentWallet) {
                throw new NotFoundException('Agent wallet not found');
            }

            // Check balance
            //convert to float for comparison
            const agentWalletBalance = parseFloat(agentWallet.balance.toString());
            const approvalPaymentAmount = parseFloat(approval.payment_amount.toString());
            
            if (agentWalletBalance < approvalPaymentAmount) {
                throw new BadRequestException(
                    `Insufficient agent wallet balance. Required: ${approvalPaymentAmount}, Available: ${agentWalletBalance}`
                );
            }

            // Deduct from agent wallet
            const newAgentBalance = agentWalletBalance - approvalPaymentAmount;
            await queryRunner.manager.update(AdminWallet, agentWallet.id, {
                balance: newAgentBalance,
                total_spent: parseFloat(agentWallet.total_spent.toString()) + approvalPaymentAmount,
            });

            // Create agent transaction
            const agentTransaction = queryRunner.manager.create(WalletTransaction, {
                admin_wallet_id: agentWallet.id,
                type: 'homepage_placement_fee',
                amount: -approvalPaymentAmount,
                status: 'completed',
                description: `Homepage ${approval.approval_type === 'homepage_coupon_push' ? 'coupon' : 'ad'} placement fee for merchant ${merchant.id}`,
                metadata: JSON.stringify({
                    approval_id: approvalId,
                    merchant_id: merchant.id,
                    placement_type: approval.approval_type,
                }),
                balance_before: agentWalletBalance,
                balance_after: newAgentBalance,
                completed_at: new Date(),
            });
            const savedAgentTransaction = await queryRunner.manager.save(agentTransaction);

            // Get super admin wallet
            const superAdminWallet = await queryRunner.manager.findOne(SuperAdminWallet, {
                where: { id: 1 }, // Assuming super admin wallet ID is 1
            });
            if (!superAdminWallet) {
                throw new NotFoundException('Super admin wallet not found');
            }

            // Add to super admin wallet
            const newSuperAdminBalance = parseFloat(superAdminWallet.balance.toString()) + approvalPaymentAmount;
            await queryRunner.manager.update(SuperAdminWallet, superAdminWallet.id, {
                balance: newSuperAdminBalance,
                total_earnings: parseFloat(superAdminWallet.total_earnings.toString()) + approvalPaymentAmount,
            });

            // Create super admin transaction
            const superAdminTransaction = queryRunner.manager.create(WalletTransaction, {
                super_admin_wallet_id: superAdminWallet.id,
                type: 'homepage_placement_revenue',
                amount: approvalPaymentAmount,
                status: 'completed',
                description: `Homepage placement revenue from agent ${merchant.admin_id}`,
                metadata: JSON.stringify({
                    approval_id: approvalId,
                    agent_id: merchant.admin_id,
                    merchant_id: merchant.id,
                    related_transaction_id: savedAgentTransaction.id,
                }),
                balance_before: superAdminWallet.balance,
                balance_after: newSuperAdminBalance,
                completed_at: new Date(),
            });
            await queryRunner.manager.save(superAdminTransaction);

            // Calculate expiry
            const settings = await this.superAdminSettingsService.getSettings();
            const duration = approval.approval_type === 'homepage_coupon_push'
                ? settings.coupon_homepage_placement_duration_days
                : settings.ad_homepage_placement_duration_days;

            const now = new Date();
            const requestedStartAt = approval.approval_type === 'homepage_coupon_push'
                ? approval.couponbatch_created_at
                : approval.ad_created_at;
            const createdAt = requestedStartAt && new Date(requestedStartAt) > now
                ? new Date(requestedStartAt)
                : now;

            const expiredAt = new Date(createdAt);
            expiredAt.setDate(expiredAt.getDate() + duration);

            // Assign slot
            const placement = await this.assignNextAvailableSlot(approval.approval_type, approval.ad_type);

            // Update approval
            const updatePayload: Partial<Approval> = {
                payment_status: 'paid',
                payment_intent_id: paymentIntentId,
                approval_status: createdAt > now ? 'payment_completed_scheduled' : 'payment_completed_active',
                placement,
            };

            if (approval.approval_type === 'homepage_coupon_push') {
                updatePayload.couponbatch_created_at = createdAt;
                updatePayload.couponbatch_expired_at = expiredAt;
            } else {
                updatePayload.ad_created_at = createdAt;
                updatePayload.ad_expired_at = expiredAt;
            }

            await queryRunner.manager.update(Approval, approvalId, updatePayload);

            await queryRunner.commitTransaction();

            return await this.findOne(approvalId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getAvailableHomepageSlots(): Promise<{
        coupons: { available: number; max: number; occupied: number };
        ads: { available: number; max: number; occupied: number };
    }> {
        const settings = await this.superAdminSettingsService.getSettings();
        
        const activeCoupons = await this.getActiveHomepagePlacementsCount('homepage_coupon_push');
        const activeAds = await this.getActiveHomepagePlacementsCount('homepage_ad_push');

        return {
            coupons: {
                available: settings.max_homepage_coupons - activeCoupons,
                max: settings.max_homepage_coupons,
                occupied: activeCoupons,
            },
            ads: {
                available: settings.max_homepage_ads - activeAds,
                max: settings.max_homepage_ads,
                occupied: activeAds,
            },
        };
    }

    private async getActiveHomepagePlacementsCount(approvalType: string): Promise<number> {
        const currentDate = new Date();
        const query = this.approvalRepository
            .createQueryBuilder('approval')
            .where('approval.approval_type = :approvalType', { approvalType })
            .andWhere('approval.approval_status IN (:...approvalStatuses)', {
                approvalStatuses: ['payment_completed_active', 'payment_completed_scheduled'],
            })
            .andWhere('approval.payment_status = :paymentStatus', { paymentStatus: 'paid' });

        if (approvalType === 'homepage_coupon_push') {
            query.andWhere('approval.couponbatch_expired_at > :currentDate', { currentDate });
        } else {
            query.andWhere('approval.ad_expired_at > :currentDate', { currentDate });
        }

        return await query.getCount();
    }

    private async isCouponBatchAlreadyActiveOnHomepage(batchId: number, excludeApprovalId?: number): Promise<boolean> {
        const currentDate = new Date();
        const query = this.approvalRepository
            .createQueryBuilder('approval')
            .innerJoin('approval.coupon', 'coupon')
            .where('approval.approval_type = :approvalType', { approvalType: 'homepage_coupon_push' })
            .andWhere('coupon.batch_id = :batchId', { batchId })
            .andWhere('approval.approval_status IN (:...approvalStatuses)', {
                approvalStatuses: ['payment_completed_active', 'payment_completed_scheduled'],
            })
            .andWhere('approval.payment_status = :paymentStatus', { paymentStatus: 'paid' })
            .andWhere('approval.couponbatch_expired_at > :currentDate', { currentDate });

        if (excludeApprovalId) {
            query.andWhere('approval.id != :excludeApprovalId', { excludeApprovalId });
        }

        const existingActivePlacement = await query.getOne();
        return Boolean(existingActivePlacement);
    }

    private async assignNextAvailableSlot(approvalType: string, preferredPlacement?: string): Promise<string> {
        const currentDate = new Date();
        const query = this.approvalRepository
            .createQueryBuilder('approval')
            .where('approval.approval_type = :approvalType', { approvalType })
            .andWhere('approval.approval_status IN (:...approvalStatuses)', {
                approvalStatuses: ['payment_completed_active', 'payment_completed_scheduled'],
            })
            .andWhere('approval.payment_status = :paymentStatus', { paymentStatus: 'paid' });

        if (approvalType === 'homepage_coupon_push') {
            query.andWhere('approval.couponbatch_expired_at > :currentDate', { currentDate });
        } else {
            query.andWhere('approval.ad_expired_at > :currentDate', { currentDate });
        }

        const activeApprovals = await query.getMany();

        const occupiedSlots = activeApprovals
            .map((a) => a.placement)
            .filter((p) => p);

        if (approvalType === 'homepage_coupon_push') {
            for (let i = 1; i <= 10; i++) {
                const slot = `homepage_coupon_slot_${i}`;
                if (!occupiedSlots.includes(slot)) {
                    return slot;
                }
            }
            throw new BadRequestException('No available coupon slots');
        } else {
            const normalizedPreferredPlacement = this.normalizeRequestedHomepageAdPlacement(preferredPlacement);
            if (normalizedPreferredPlacement) {
                const preferredSlot = this.mapHomepageAdPlacementToSlot(normalizedPreferredPlacement);
                if (occupiedSlots.includes(preferredSlot)) {
                    throw new BadRequestException(`Selected ad placement '${normalizedPreferredPlacement}' is not available right now`);
                }
                return preferredSlot;
            }

            for (let i = 1; i <= 4; i++) {
                const slot = `homepage_ad_slot_${i}`;
                if (!occupiedSlots.includes(slot)) {
                    return slot;
                }
            }
            throw new BadRequestException('No available ad slots');
        }
    }

    private normalizeRequestedHomepageAdPlacement(value?: string): 'top' | 'bottom' | 'left' | 'right' | null {
        if (!value) return null;

        const normalized = String(value).trim().toLowerCase();
        const mapped: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
            top: 'top',
            bottom: 'bottom',
            left: 'left',
            right: 'right',
            image: 'top',
            video: 'top',
        };

        return mapped[normalized] || null;
    }

    private mapHomepageAdPlacementToSlot(placement: 'top' | 'bottom' | 'left' | 'right'): string {
        const mapped: Record<'top' | 'bottom' | 'left' | 'right', string> = {
            top: 'homepage_ad_slot_1',
            left: 'homepage_ad_slot_2',
            right: 'homepage_ad_slot_3',
            bottom: 'homepage_ad_slot_4',
        };

        return mapped[placement];
    }

    private resolveHomepagePlacementStartDate(startDate?: string): Date {
        if (!startDate) {
            return new Date();
        }

        const parsedDate = new Date(startDate);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new BadRequestException('Invalid start date');
        }

        const normalized = new Date(parsedDate);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    // ============ PHASE 4: HOMEPAGE DISPLAY ENDPOINTS ============

    /**
     * Get all active homepage coupons for public display
     * Status: payment_completed_active AND not expired
     */
    async getActiveHomepageCoupons(): Promise<Approval[]> {
        const approvals = await this.approvalRepository.find({
            where: {
                approval_type: 'homepage_coupon_push',
                approval_status: 'payment_completed_active',
                payment_status: 'paid',
                couponbatch_expired_at: MoreThan(new Date()),
            },
            relations: ['merchant', 'merchant.settings', 'coupon', 'coupon.batch', 'coupon.batch.template'],
            order: {
                placement: 'ASC',
            },
        });

        const byBatch = new Map<number, Approval>();
        const withoutBatch: Approval[] = [];

        approvals.forEach((approval) => {
            const batchId = approval?.coupon?.batch?.id;
            if (!batchId) {
                withoutBatch.push(approval);
                return;
            }
            if (!byBatch.has(batchId)) {
                byBatch.set(batchId, approval);
            }
        });

        return [...Array.from(byBatch.values()), ...withoutBatch];
    }

    /**
     * Get all active homepage ads for public display
     * Status: payment_completed_active AND not expired
     */
    async getActiveHomepageAds(): Promise<any[]> {
        const currentDate = new Date();
        const approvals = await this.approvalRepository.find({
            where: [
                {
                    approval_type: 'homepage_ad_push',
                    approval_status: 'payment_completed_active',
                    payment_status: 'paid',
                    ad_expired_at: MoreThan(currentDate),
                },
                // {
                //     approval_type: 'homepage_ad_push',
                //     approval_status: 'payment_completed_active',
                //     payment_status: 'paid',
                //     ad_expired_at: IsNull(),
                // },
            ],
            relations: ['merchant', 'merchant.settings'],
            order: {
                placement: 'ASC',
            },
        });

        return approvals.map((approval) => ({
            ...approval,
            paid_ad_image:
                approval.merchant?.settings?.paid_ad_image ||
                approval.merchant?.paid_ad_image ||
                null,
            paid_ad_video: approval.merchant?.settings?.paid_ad_video,
            paid_ad_video_status: approval.merchant?.settings?.paid_ad_video_status,
            paid_ad_placement: this.normalizeHomepageAdPlacement(
                approval.placement || approval.merchant?.settings?.paid_ad_placement || approval.merchant?.placement,
            ),
        }));
    }

    private normalizeHomepageAdPlacement(placement?: string): string {
        if (!placement) return 'top';

        const normalizedPlacement = String(placement).trim().toLowerCase();

        const mapped: Record<string, string> = {
            homepage_ad_slot_1: 'top',
            homepage_ad_slot_2: 'left',
            homepage_ad_slot_3: 'right',
            homepage_ad_slot_4: 'bottom',
        };

        return mapped[normalizedPlacement] || normalizedPlacement;
    }
}
