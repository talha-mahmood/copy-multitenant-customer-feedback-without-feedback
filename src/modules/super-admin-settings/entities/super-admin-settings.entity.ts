import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('super_admin_settings')
export class SuperAdminSettings extends BaseEntity {
  @Column({ name: 'admin_subscription_fee', type: 'decimal', precision: 10, scale: 2, default: 1199.00 })
  admin_subscription_fee: number; // Fee for admin annual subscription

  @Column({ name: 'temporary_merchant_commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.20 })
  temporary_merchant_commission_rate: number; // Commission rate for temporary merchants (e.g., 0.20 = 20%)

  @Column({ name: 'annual_merchant_commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.02 })
  annual_merchant_commission_rate: number; // Commission rate for annual merchants (e.g., 0.02 = 2%)

  @Column({ name: 'merchant_annual_fee', type: 'decimal', precision: 10, scale: 2, default: 1199.00 })
  merchant_annual_fee: number; // Annual subscription fee for merchants

  @Column({ name: 'admin_annual_commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.75 })
  admin_annual_commission_rate: number; // Commission rate admin gets for merchant annual upgrades (e.g., 0.75 = 75%)

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}
