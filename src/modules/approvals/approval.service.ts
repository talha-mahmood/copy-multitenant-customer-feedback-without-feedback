import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';

@Injectable()
export class ApprovalService {
    constructor(
        @Inject('APPROVAL_REPOSITORY')
        private approvalRepository: Repository<Approval>,
    ) { }

    async create(createApprovalDto: CreateApprovalDto): Promise<Approval> {
        const approval = this.approvalRepository.create(createApprovalDto);
        return await this.approvalRepository.save(approval);
    }

    async findAll(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            relations: ['merchant', 'admin'],
        });
    }

    async findOne(id: number): Promise<Approval> {
        const approval = await this.approvalRepository.findOne({
            where: { id },
            relations: ['merchant', 'admin'],
        });

        if (!approval) {
            throw new NotFoundException(`Approval with ID ${id} not found`);
        }

        return approval;
    }

    async findByMerchant(merchantId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { merchant_id: merchantId },
            relations: ['merchant', 'admin'],
        });
    }

    async findByAdmin(adminId: number): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { admin_id: adminId },
            relations: ['merchant', 'admin'],
        });
    }

    async findPending(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: false },
            relations: ['merchant', 'admin'],
        });
    }

    async findApproved(): Promise<Approval[]> {
        return await this.approvalRepository.find({
            where: { approval_status: true },
            relations: ['merchant', 'admin'],
        });
    }

    async update(id: number, updateApprovalDto: UpdateApprovalDto): Promise<Approval> {
        const approval = await this.findOne(id);

        Object.assign(approval, updateApprovalDto);

        return await this.approvalRepository.save(approval);
    }

    async remove(id: number): Promise<void> {
        const approval = await this.findOne(id);
        await this.approvalRepository.remove(approval);
    }

    async approve(id: number, adminId: number): Promise<Approval> {
        const approval = await this.findOne(id);

        approval.approval_status = true;
        approval.admin_id = adminId;

        return await this.approvalRepository.save(approval);
    }

    async reject(id: number, adminId: number): Promise<Approval> {
        const approval = await this.findOne(id);

        approval.approval_status = false;
        approval.admin_id = adminId;

        return await this.approvalRepository.save(approval);
    }
}
