import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MerchantSetting } from '../merchant-settings/entities/merchant-setting.entity';

@Injectable()
export class ApprovalService {
    constructor(
        @Inject('APPROVAL_REPOSITORY')
        private approvalRepository: Repository<Approval>,
        @Inject('MERCHANT_REPOSITORY')
        private merchantRepository: Repository<Merchant>,
        @Inject('MERCHANT_SETTING_REPOSITORY')
        private merchantSettingRepository: Repository<MerchantSetting>,
    ) { }

    async create(createApprovalDto: CreateApprovalDto): Promise<Approval> {
        const approval = this.approvalRepository.create(createApprovalDto);
        return await this.approvalRepository.save(approval);
    }

    async findAll(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            relations: ['merchant', 'merchant.settings', 'admin'],
        });
    }

    async findOne(id: number): Promise<Approval> {
        const approval = await this.approvalRepository.findOne({
            where: { id },
            relations: ['merchant', 'merchant.settings', 'admin'],
        });

        if (!approval) {
            throw new NotFoundException(`Approval with ID ${id} not found`);
        }

        return approval;
    }

    async findByMerchant(merchantId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { merchant_id: merchantId },
            relations: ['merchant', 'merchant.settings', 'admin'],
        });
    }

    async findByAdmin(adminId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { admin_id: adminId },
            relations: ['merchant', 'merchant.settings', 'admin'],
        });
    }

    async findByAgent(agentId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { agent_id: agentId },
            relations: ['merchant', 'merchant.settings', 'admin'],
        });
    }

    async findPending(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: 'pending' },
            relations: ['merchant', 'merchant.settings', 'admin'],
        });
    }

    async findApproved(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: 'approved' },
            relations: ['merchant', 'merchant.settings', 'admin'],
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

        approval.approval_status = 'approved';
        approval.admin_id = adminId;

        console.log(`[ApprovalService] Approving ${id}, new status: ${approval.approval_status}`);
        await this.approvalRepository.update(id, {
            approval_status: 'approved',
            admin_id: adminId
        });

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
        const approvals = await this.approvalRepository.find({
            where: {
                admin_id: adminId,
                approval_status: 'approved',
                approval_type: 'paid_ad',
            },
            relations: ['merchant', 'merchant.settings'],
        });

        return approvals.map((approval) => ({
            ...approval.merchant,
            paid_ad_image: approval.merchant?.settings?.paid_ad_image,
            paid_ad_placement: approval.merchant?.settings?.paid_ad_placement,
            paid_ad_video: approval.merchant?.settings?.paid_ad_video,
        }));
    }

    private async handleApprovalSideEffects(approval: Approval): Promise<void> {
        try {
            console.log(`[ApprovalService] Handling side effects for type: ${approval.approval_type}, status: ${approval.approval_status}`);
            if (approval.approval_type === 'paid_ad') {
                const isActive = approval.approval_status === 'approved';

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
}
