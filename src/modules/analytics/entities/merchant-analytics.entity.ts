import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

@Entity('merchant_analytics')
@Index(['merchant_id', 'admin_id', 'paid_ad_id'], { unique: true })
export class MerchantAnalytics extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'admin_id' })
  admin_id: number;

  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ name: 'paid_ad_id' })
  paid_ad_id: number;

  @Column({ name: 'impressions', type: 'int', default: 0 })
  impressions: number;

  @Column({ name: 'clicks', type: 'int', default: 0, nullable: true })
  clicks: number;
}
