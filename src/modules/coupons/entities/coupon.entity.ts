import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ name: 'batch_id' })
  batch_id: number;

  @ManyToOne(() => CouponBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: CouponBatch;

  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'customer_id', nullable: true })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'coupon_code', length: 50, unique: true })
  coupon_code: string;

  @Column({ name: 'qr_hash', length: 255, nullable: true })
  qr_hash: string;

  @Column({ length: 50, default: 'issued' }) // 'issued', 'redeemed', 'expired'
  status: string;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issued_at: Date;

  @Column({ name: 'redeemed_at', type: 'timestamp', nullable: true })
  redeemed_at: Date;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdf_url: string;
}
