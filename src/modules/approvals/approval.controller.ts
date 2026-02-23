import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    UnauthorizedException,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalExpiryCronService } from './approval-expiry-cron.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { CreateHomepageCouponRequestDto } from './dto/create-homepage-coupon-request.dto';
import { CreateHomepageAdRequestDto } from './dto/create-homepage-ad-request.dto';
import { DisapproveApprovalDto } from './dto/disapprove-approval.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, User } from '../../common/decorators/current-user';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
    constructor(
        private readonly approvalService: ApprovalService,
        private readonly approvalExpiryCronService: ApprovalExpiryCronService,
    ) { }

    @Post()
    create(@Body() createApprovalDto: CreateApprovalDto) {
        return this.approvalService.create(createApprovalDto);
    }

    @Get()
    findAll() {
        return this.approvalService.findAll();
    }

    @Get('pending')
    findPending() {
        return this.approvalService.findPending();
    }

    @Get('approved')
    findApproved() {
        return this.approvalService.findApproved();
    }

    @Get('merchant/:merchantId')
    findByMerchant(@Param('merchantId', ParseIntPipe) merchantId: number) {
        return this.approvalService.findByMerchant(merchantId);
    }

    @Get('admin/:adminId')
    findByAdmin(@Param('adminId', ParseIntPipe) adminId: number) {
        return this.approvalService.findByAdmin(adminId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.approvalService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateApprovalDto: UpdateApprovalDto,
    ) {
        const targetId = updateApprovalDto['id'] || id;
        return this.approvalService.update(targetId, updateApprovalDto);
    }

    @Patch(':id/approve')
    approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @CurrentUser() user: User,
    ) {
        const targetId = body.id || id;
        if (!user.adminId) {
            throw new UnauthorizedException('Admin ID not found in token');
        }
        return this.approvalService.approve(targetId, user.adminId);
    }

    @Patch(':id/reject')
    reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @CurrentUser() user: User,
    ) {
        const targetId = body.id || id;
        if (!user.adminId) {
            throw new UnauthorizedException('Admin ID not found in token');
        }
        return this.approvalService.reject(targetId, user.adminId);
    }


    @Public()
    @Get('approved-paid-ads/admin/:adminId')
    getApprovedPaidAdds(@Param('adminId', ParseIntPipe) adminId: number) {
        return this.approvalService.getApprovedPaidAdds(adminId);
    }


    @Public()
    @Get('available-placements')
    getAvailablePlacementsSystemWide() {
        return this.approvalService.getAvailablePlacementsSystemWide();
    }


    @Public()
    @Get('available-placements/admin/:adminId')
    getAvailablePlacements(@Param('adminId', ParseIntPipe) adminId: number) {
        return this.approvalService.getAvailablePlacements(adminId);
    }

    @Public()
    @Get('available-placements/merchant/:merchantId')
    getAvailablePlacementsForMerchant(@Param('merchantId', ParseIntPipe) merchantId: number) {
        return this.approvalService.getAvailablePlacementsForMerchant(merchantId);
    }

    // ============ HOMEPAGE PUSH ENDPOINTS (Phase 2) ============

    @Post('homepage-coupon-push')
    createHomepageCouponRequest(
        @Body() dto: CreateHomepageCouponRequestDto,
        @CurrentUser() user: User,
    ) {
        if (!user.merchantId) {
            throw new UnauthorizedException('Merchant ID not found in token');
        }
        return this.approvalService.createHomepageCouponRequest(user.merchantId, dto.coupon_id);
    }

    @Post('homepage-ad-push')
    createHomepageAdRequest(
        @Body() dto: CreateHomepageAdRequestDto,
        @CurrentUser() user: User,
    ) {
        if (!user.merchantId) {
            throw new UnauthorizedException('Merchant ID not found in token');
        }
        return this.approvalService.createHomepageAdRequest(user.merchantId, dto.ad_type);
    }

    @Patch(':id/forward-to-superadmin')
    forwardToSuperAdmin(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ) {
        if (!user.adminId) {
            throw new UnauthorizedException('Admin ID not found in token');
        }
        return this.approvalService.forwardToSuperAdmin(id, user.adminId);
    }

    @Patch(':id/disapprove-by-agent')
    disapproveByAgent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: DisapproveApprovalDto,
        @CurrentUser() user: User,
    ) {
        if (!user.adminId) {
            throw new UnauthorizedException('Admin ID not found in token');
        }
        return this.approvalService.disapproveByAgent(id, user.adminId, dto.reason);
    }

    @Get('agent-pending')
    getPendingRequestsForAgent(@CurrentUser() user: User) {
        if (!user.adminId) {
            throw new UnauthorizedException('Admin ID not found in token');
        }
        return this.approvalService.getPendingRequestsForAgent(user.adminId);
    }

    @Get('superadmin-forwarded')
    getForwardedRequestsForSuperAdmin() {
        return this.approvalService.getForwardedRequestsForSuperAdmin();
    }

    // ============ PHASE 3: SUPER ADMIN APPROVAL & PAYMENT ============

    @Patch(':id/approve-by-superadmin')
    approveBySuperAdmin(@Param('id', ParseIntPipe) id: number) {
        return this.approvalService.approveBySuperAdmin(id);
    }

    @Patch(':id/reject-by-superadmin')
    rejectBySuperAdmin(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: DisapproveApprovalDto,
    ) {
        return this.approvalService.rejectBySuperAdmin(id, dto.reason);
    }

    @Post(':id/process-payment')
    processHomepagePlacementPayment(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { payment_intent_id: string },
        @CurrentUser() user: User,
    ) {
        if (!user.merchantId) {
            throw new UnauthorizedException('Merchant ID not found in token');
        }
        return this.approvalService.processHomepagePlacementPayment(id, body.payment_intent_id);
    }

    @Get('available-homepage-slots')
    @Public()
    getAvailableHomepageSlots() {
        return this.approvalService.getAvailableHomepageSlots();
    }

    // ...existing code...

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.approvalService.remove(id);
    }
}
