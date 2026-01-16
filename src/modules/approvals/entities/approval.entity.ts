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

    @Column({ name: 'paid_ad_placement', type: 'text', nullable: true })
    paid_ad_placement: string;

    @Column({ name: 'paid_ad_image', type: 'text', nullable: true })
    paid_ad_image: string;

    @Column({ name: 'approval_status', type: 'boolean', default: false })
    approval_status: boolean;

    @Column({ name: 'admin_id', nullable: true })
    admin_id: number;

    @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin;
}
