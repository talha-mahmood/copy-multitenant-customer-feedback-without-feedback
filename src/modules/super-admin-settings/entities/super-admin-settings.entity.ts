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

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}
