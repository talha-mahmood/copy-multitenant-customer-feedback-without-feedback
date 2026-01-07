import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Entity('merchant_settings')
export class MerchantSetting extends BaseEntity {
  @Column({ name: 'merchant_id', unique: true })
  merchant_id: number;

  @Column({ name: 'enable_preset_reviews', default: true })
  enable_preset_reviews: boolean;

  @Column({ name: 'enable_google_reviews', default: true })
  enable_google_reviews: boolean;

  @Column({ name: 'enable_facebook_reviews', default: false })
  enable_facebook_reviews: boolean;

  @Column({ name: 'enable_instagram_reviews', default: false })
  enable_instagram_reviews: boolean;

  @Column({ name: 'enable_xiaohongshu_reviews', default: false })
  enable_xiaohongshu_reviews: boolean;

  @Column({ name: 'google_review_url', type: 'text', nullable: true })
  google_review_url: string;

  @Column({ name: 'facebook_page_url', type: 'text', nullable: true })
  facebook_page_url: string;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagram_url: string;

  @Column({ name: 'xiaohongshu_url', type: 'text', nullable: true })
  xiaohongshu_url: string;

  @Column({ name: 'paid_ads', type: 'boolean', default: false })
  paid_ads: boolean;

  @Column({ name: 'paid_ad_image', type: 'text', nullable: true, default: null })
  paid_ad_image: string;

  @Column({ name: 'placement', length: 255, nullable: true, default: null })
  placement: string;

  @OneToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;
}
