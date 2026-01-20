import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

@Entity('approvals')
export class Approval extends BaseEntity {
    @Column({ name: 'merchant_id' })
    merchant_id: number;

    @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_id' })
    merchant: Merchant;

    @Column({ name: 'approval_type', type: 'varchar', length: 100 })
    approval_type: string;

    @Column({ name: 'approval_owner', type: 'varchar', length: 50, default: 'agent' })
    approval_owner: string;

    @Column({ name: 'agent_id', nullable: true })
    agent_id: number;

    @Column({ name: 'request_from', type: 'varchar', length: 50, default: 'merchant' })
    request_from: string;

    @Column({ name: 'approval_status', type: 'varchar', length: 20, default: 'pending' })
    approval_status: string;

    @Column({ name: 'admin_id', nullable: true })
    admin_id: number;

    @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin;
}
