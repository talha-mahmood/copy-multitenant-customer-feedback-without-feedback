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
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, User } from '../../common/decorators/current-user';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
    constructor(private readonly approvalService: ApprovalService) { }

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

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.approvalService.remove(id);
    }
}
