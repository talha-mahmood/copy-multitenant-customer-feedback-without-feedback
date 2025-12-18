import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Entity('coupon_batches')
export class CouponBatch extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchantId: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ length: 255 })
  batchName: string;

  @Column({ length: 50 }) // 'annual' or 'temporary'
  batchType: string;

  @Column({ type: 'int' })
  totalQuantity: number;

  @Column({ type: 'int', default: 0 })
  issuedQuantity: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  couponTemplateId: number;

  @Column({ default: false })
  whatsappEnabled: boolean;

  @Column({ default: false })
  luckyDrawEnabled: boolean;
}
