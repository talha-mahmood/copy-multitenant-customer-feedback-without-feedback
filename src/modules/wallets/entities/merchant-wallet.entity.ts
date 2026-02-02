import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('merchant_wallets')
export class MerchantWallet extends BaseEntity {
  @Column({ name: 'merchant_id', unique: true })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'coupon_credits', type: 'int', default: 0 })
  coupon_credits: number;

  @Column({ name: 'whatsapp_ui_credits', type: 'int', default: 0 })
  whatsapp_ui_credits: number; // User-Initiated WhatsApp messages

  @Column({ name: 'whatsapp_bi_credits', type: 'int', default: 0 })
  whatsapp_bi_credits: number; // Business-Initiated WhatsApp messages

  @Column({ name: 'paid_ad_credits', type: 'int', default: 0 })
  paid_ad_credits: number;

  @Column({ name: 'total_credits_purchased', type: 'int', default: 0 })
  total_credits_purchased: number;

  @Column({ name: 'total_credits_used', type: 'int', default: 0 })
  total_credits_used: number;

  @Column({ name: 'subscription_type', type: 'varchar', length: 20, default: 'temporary' })
  subscription_type: string; // 'annual' or 'temporary'

  @Column({ name: 'subscription_expires_at', type: 'timestamp', nullable: true })
  subscription_expires_at: Date;

  @Column({ name: 'is_subscription_expired', type: 'boolean', default: false })
  is_subscription_expired: boolean;

  @Column({ name: 'annual_fee_paid', type: 'boolean', default: false })
  annual_fee_paid: boolean;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.merchant_wallet)
  transactions: WalletTransaction[];
}
