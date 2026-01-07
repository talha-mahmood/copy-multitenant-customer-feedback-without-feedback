import { Column, Entity, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';
import { MerchantSetting } from 'src/modules/merchant-settings/entities/merchant-setting.entity';

@Entity('merchants')
export class Merchant extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ name: 'map_link', type: 'text', nullable: true })
  map_link: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ name: 'business_name', length: 255 })
  business_name: string;

  @Column({ name: 'business_type', length: 100 })
  business_type: string;

  @Column({ name: 'merchant_type', length: 50 })
  merchant_type: string; // 'temporary' or 'annual'

  @Column({ name: 'tax_id', length: 100, nullable: true })
  tax_id: string;

  @Column({ name: 'qr_code_url', type: 'text', nullable: true })
  qr_code_url: string;

  @Column({ name: 'qr_code_hash', length: 255, nullable: true })
  qr_code_hash: string;

  @Column({ name: 'qr_code_image', type: 'text', nullable: true })
  qr_code_image: string;

  @Column({ name: 'paid_ads', type: 'boolean', default: false })
  paid_ads: boolean;

  @Column({ name: 'paid_ad_image', type: 'text', nullable: true, default: null })
  paid_ad_image: string;

  @OneToMany(() => CouponBatch, (batch) => batch.merchant)
  batches: CouponBatch[];

  @OneToOne(() => MerchantSetting, (setting) => setting.merchant)
  settings: MerchantSetting;
}
