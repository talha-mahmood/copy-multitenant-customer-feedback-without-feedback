import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { CouponTemplate } from 'src/modules/coupons/entities/coupon-template.entity';

@Entity('coupon_batches')
export class CouponBatch extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'batch_name', length: 255 })
  batch_name: string;

  @Column({ name: 'batch_type', length: 50 }) // 'annual' or 'temporary'
  batch_type: string;

  @Column({ name: 'total_quantity', type: 'int' })
  total_quantity: number;

  @Column({ name: 'issued_quantity', type: 'int', default: 0 })
  issued_quantity: number;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date' })
  end_date: Date;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'template_id', type: 'int', nullable: true })
  template_id: number;

  @Column({ name: 'whatsapp_enabled', default: false })
  whatsapp_enabled: boolean;

  @Column({ name: 'lucky_draw_enabled', default: false })
  lucky_draw_enabled: boolean;

  @Column({ name: 'ishalal', default: false })
  ishalal: boolean;

  @Column({ name: 'visibility', default: false })
  visibility: boolean;

  @Column({ name: 'placement', length: 255, nullable: true, default: null })
  placement: string;

  @ManyToOne(() => CouponTemplate)
  @JoinColumn({ name: 'template_id' })
  template: CouponTemplate;

  @Column({ name: 'header', type: 'varchar', length: 255, nullable: true })
  header: string;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;
}
