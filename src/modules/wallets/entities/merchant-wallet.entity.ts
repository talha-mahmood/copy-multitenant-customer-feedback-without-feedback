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

  @Column({ name: 'message_credits', type: 'int', default: 0 })
  message_credits: number;

  @Column({ name: 'marketing_credits', type: 'int', default: 0 })
  marketing_credits: number;

  @Column({ name: 'utility_credits', type: 'int', default: 0 })
  utility_credits: number;

  @Column({ name: 'total_credits_purchased', type: 'int', default: 0 })
  total_credits_purchased: number;

  @Column({ name: 'total_credits_used', type: 'int', default: 0 })
  total_credits_used: number;

  @Column({ name: 'subscription_type', type: 'varchar', length: 20, default: 'temporary' })
  subscription_type: string; // 'annual' or 'temporary'

  @Column({ name: 'subscription_expires_at', type: 'timestamp', nullable: true })
  subscription_expires_at: Date;

  @Column({ name: 'annual_fee_paid', type: 'boolean', default: false })
  annual_fee_paid: boolean;

  @Column({ type: 'varchar', length: 10, default: 'MYR' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.merchant_wallet)
  transactions: WalletTransaction[];
}
