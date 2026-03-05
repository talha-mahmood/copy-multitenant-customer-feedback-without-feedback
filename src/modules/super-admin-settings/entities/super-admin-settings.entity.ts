import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('super_admin_settings')
export class SuperAdminSettings extends BaseEntity {
  @Column({ name: 'admin_annual_subscription_fee', type: 'decimal', precision: 10, scale: 2, default: 1199.00 })
  admin_annual_subscription_fee: number; // Fee for admin annual subscription

  @Column({ name: 'merchant_annual_fee', type: 'decimal', precision: 10, scale: 2, default: 1199.00 })
  merchant_annual_fee: number; // Annual subscription fee for merchants

  // Platform Costs (Agent Prepaid Wallet Deduction Amounts)
  @Column({ name: 'merchant_annual_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 299.00 })
  merchant_annual_platform_cost: number; // Platform cost deducted from agent wallet when merchant registers annual (RM299)

  @Column({ name: 'whatsapp_bi_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 0.45 })
  whatsapp_bi_platform_cost: number; // Platform cost per WhatsApp BI (Business-Initiated) message

  // WhatsApp UI Platform Costs (Separate for Annual and Temporary Merchants)
  @Column({ name: 'whatsapp_ui_annual_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 0.12 })
  whatsapp_ui_annual_platform_cost: number; // Platform cost per WhatsApp UI message for annual merchants

  @Column({ name: 'whatsapp_ui_temporary_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 0.12 })
  whatsapp_ui_temporary_platform_cost: number; // Platform cost per WhatsApp UI message for temporary merchants

  // Coupon Platform Costs (Separate for Annual and Temporary Merchants)
  @Column({ name: 'coupon_annual_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 0.05 })
  coupon_annual_platform_cost: number; // Platform cost per coupon credit for annual merchants

  @Column({ name: 'coupon_temporary_platform_cost', type: 'decimal', precision: 10, scale: 2, default: 0.05 })
  coupon_temporary_platform_cost: number; // Platform cost per coupon credit for temporary merchants

  // Homepage Placement Settings
  @Column({ name: 'homepage_coupon_placement_cost', type: 'decimal', precision: 10, scale: 2, default: 50.00 })
  homepage_coupon_placement_cost: number; // Cost for placing coupon on super admin homepage

  @Column({ name: 'homepage_ad_placement_cost', type: 'decimal', precision: 10, scale: 2, default: 100.00 })
  homepage_ad_placement_cost: number; // Cost for placing ad on super admin homepage

  @Column({ name: 'max_homepage_coupons', type: 'int', default: 10 })
  max_homepage_coupons: number; // Maximum number of coupons on super admin homepage

  @Column({ name: 'max_homepage_ads', type: 'int', default: 4 })
  max_homepage_ads: number; // Maximum number of ads on super admin homepage

  @Column({ name: 'coupon_homepage_placement_duration_days', type: 'int', default: 7 })
  coupon_homepage_placement_duration_days: number; // Duration in days for coupon homepage placement

  @Column({ name: 'ad_homepage_placement_duration_days', type: 'int', default: 7 })
  ad_homepage_placement_duration_days: number; // Duration in days for ad homepage placement

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}
