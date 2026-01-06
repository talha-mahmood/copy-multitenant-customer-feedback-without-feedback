import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { LuckyDrawPrize } from './lucky-draw-prize.entity';

@Entity('lucky_draw_results')
export class LuckyDrawResult extends BaseEntity {
  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'batch_id', nullable: true })
  batch_id: number;

  @ManyToOne(() => CouponBatch, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batch_id' })
  batch: CouponBatch;

  @Column({ name: 'prize_id' })
  prize_id: number;

  @ManyToOne(() => LuckyDrawPrize, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prize_id' })
  prize: LuckyDrawPrize;

  @Column({ name: 'spin_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  spin_date: Date;

  @Column({ name: 'is_claimed', default: false })
  is_claimed: boolean;

  @Column({ name: 'claimed_at', type: 'timestamp', nullable: true })
  claimed_at: Date;
}
