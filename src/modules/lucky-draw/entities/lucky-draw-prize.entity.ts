import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

@Entity('lucky_draw_prizes')
export class LuckyDrawPrize extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'batch_id', nullable: true })
  batch_id: number;

  @ManyToOne(() => CouponBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: CouponBatch;

  @Column({ name: 'prize_name', length: 255 })
  prize_name: string;

  @Column({ name: 'prize_description', type: 'text', nullable: true })
  prize_description: string;

  @Column({ name: 'prize_type', length: 50 })
  prize_type: string; // 'coupon', 'discount', 'free_item', 'no_prize'

  @Column({ name: 'probability', type: 'decimal', precision: 5, scale: 2 })
  probability: number; // 0.00 to 100.00

  @Column({ name: 'daily_limit', type: 'int', nullable: true })
  daily_limit: number;

  @Column({ name: 'total_limit', type: 'int', nullable: true })
  total_limit: number;

  @Column({ name: 'daily_count', type: 'int', default: 0 })
  daily_count: number;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  total_count: number;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;
}
