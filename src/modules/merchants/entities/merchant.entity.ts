import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CouponBatch } from 'src/modules/coupon-batches/entities/coupon-batch.entity';

@Entity('merchants')
export class Merchant extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  address: string;

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

  @Column({ name: 'enable_preset_reviews', default: true })
  enable_preset_reviews: boolean;

  @Column({ name: 'google_review_url', type: 'text', nullable: true })
  google_review_url: string;

  @Column({ name: 'facebook_page_url', type: 'text', nullable: true })
  facebook_page_url: string;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagram_url: string;

  @Column({ name: 'xiaohongshu_url', type: 'text', nullable: true })
  xiaohongshu_url: string;

  @Column({ name: 'enable_google_reviews', default: true })
  enable_google_reviews: boolean;

  @Column({ name: 'enable_facebook_reviews', default: false })
  enable_facebook_reviews: boolean;

  @Column({ name: 'enable_instagram_reviews', default: false })
  enable_instagram_reviews: boolean;

  @Column({ name: 'enable_xiaohongshu_reviews', default: false })
  enable_xiaohongshu_reviews: boolean;

  @OneToMany(() => CouponBatch, (batch) => batch.merchant)
  batches: CouponBatch[];
}
