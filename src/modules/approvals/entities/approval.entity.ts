import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';

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

    @Column({ name: 'approval_status', type: 'varchar', length: 50, default: 'pending' })
    approval_status: string;

    @Column({ name: 'ad_type', type: 'varchar', length: 20, nullable: true })
    ad_type: string;

    @Column({ name: 'admin_id', nullable: true })
    admin_id: number;

    @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin;

    @Column({ name: 'ad_created_at', type: 'timestamp', nullable: true })
    ad_created_at: Date;

    @Column({ name: 'ad_expired_at', type: 'timestamp', nullable: true })
    ad_expired_at: Date;

    @Column({ name: 'placement', type: 'varchar', length: 50, nullable: true })
    placement: string;

    // Homepage push request fields
    @Column({ name: 'coupon_id', nullable: true })
    coupon_id: number;

    @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coupon_id' })
    coupon: Coupon;

    @Column({ name: 'forwarded_by_agent', type: 'boolean', default: false })
    forwarded_by_agent: boolean;

    @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'pending' })
    payment_status: string; // 'pending', 'paid', 'refunded'

    @Column({ name: 'payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    payment_amount: number;

    @Column({ name: 'payment_intent_id', type: 'varchar', length: 255, nullable: true })
    payment_intent_id: string;

    @Column({ name: 'disapproval_reason', type: 'text', nullable: true })
    disapproval_reason: string;
}
