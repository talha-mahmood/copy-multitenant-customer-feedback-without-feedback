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
  google_review_url: string | null;

  @Column({ name: 'facebook_page_url', type: 'text', nullable: true })
  facebook_page_url: string | null;

  @Column({ name: 'instagram_url', type: 'text', nullable: true })
  instagram_url: string | null;

  @Column({ name: 'xiaohongshu_url', type: 'text', nullable: true })
  xiaohongshu_url: string | null;

  @Column({ name: 'paid_ads', type: 'boolean', default: false })
  paid_ads: boolean;

  @Column({ name: 'paid_ad_image', type: 'text', nullable: true, default: null })
  paid_ad_image: string | null;

  @Column({ name: 'paid_ad_video', type: 'text', nullable: true, default: null })
  paid_ad_video: string | null;

  @Column({ name: 'paid_ad_video_status', type: 'boolean', default: false })
  paid_ad_video_status: boolean;

  @Column({ name: 'paid_ad_placement', type: 'text', nullable: true, default: 'top' })
  paid_ad_placement: string | null;

  @Column({ name: 'paid_ad_duration', type: 'int', default: 7 })
  paid_ad_duration: number;

  @Column({ name: 'placement', type: 'varchar', length: 255, nullable: true, default: null })
  placement: string | null;

  @Column({ name: 'luckydraw_enabled', default: false })
  luckydraw_enabled: boolean;

  @Column({ name: 'whatsapp_enabled_for_batch_id', type: 'int', nullable: true })
  whatsapp_enabled_for_batch_id: number | null;

  @Column({ name: 'birthday_message_enabled', type: 'boolean', default: false })
  birthday_message_enabled: boolean;

  @Column({ name: 'days_before_birthday', type: 'int', default: 0 })
  days_before_birthday: number;

  @Column({ name: 'days_after_birthday', type: 'int', default: 0 })
  days_after_birthday: number;

  @Column({ name: 'birthday_coupon_batch_id', type: 'int', nullable: true })
  birthday_coupon_batch_id: number | null;

  @Column({ name: 'inactive_recall_enabled', type: 'boolean', default: false })
  inactive_recall_enabled: boolean;

  @Column({ name: 'inactive_recall_days', type: 'int', default: 30 })
  inactive_recall_days: number;

  @Column({ name: 'inactive_recall_coupon_batch_id', type: 'int', nullable: true })
  inactive_recall_coupon_batch_id: number | null;

  @Column({ name: 'festival_campaign_enabled', type: 'boolean', default: false })
  festival_campaign_enabled: boolean;

  @Column({ name: 'scheduled_campaign_enabled', type: 'boolean', default: false })
  scheduled_campaign_enabled: boolean;

  @OneToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;
}
