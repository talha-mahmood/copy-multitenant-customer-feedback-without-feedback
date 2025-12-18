import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ name: 'batch_id' })
  batchId: number;

  @ManyToOne(() => CouponBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: CouponBatch;

  @Column({ name: 'merchant_id' })
  merchantId: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 50, unique: true })
  couponCode: string;

  @Column({ length: 255, nullable: true })
  qrHash: string;

  @Column({ length: 50, default: 'issued' }) // 'issued', 'redeemed', 'expired'
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;
}
