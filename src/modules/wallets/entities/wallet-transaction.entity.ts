import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { AdminWallet } from './admin-wallet.entity';
import { MerchantWallet } from './merchant-wallet.entity';
import { SuperAdminWallet } from './super-admin-wallet.entity';

@Entity('wallet_transactions')
export class WalletTransaction extends BaseEntity {
  @Column({ name: 'admin_wallet_id', nullable: true })
  admin_wallet_id: number;

  @ManyToOne(() => AdminWallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_wallet_id' })
  admin_wallet: AdminWallet;

  @Column({ name: 'merchant_wallet_id', nullable: true })
  merchant_wallet_id: number;

  @ManyToOne(() => MerchantWallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_wallet_id' })
  merchant_wallet: MerchantWallet;

  @Column({ name: 'super_admin_wallet_id', nullable: true })
  super_admin_wallet_id: number;

  @ManyToOne(() => SuperAdminWallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'super_admin_wallet_id' })
  super_admin_wallet: SuperAdminWallet;

  @Column({ type: 'varchar', length: 100 })
  type: string; // 'credit', 'debit', 'merchant_annual_subscription_commission', 'merchant_package_commission', 'refund', 'purchase'

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'int', nullable: true })
  credits: number;

  @Column({ name: 'credit_type', type: 'varchar', length: 20, nullable: true })
  credit_type: string; // 'marketing', 'utility', 'general'

  @Column({ name: 'transaction_reference', type: 'varchar', length: 100, nullable: true })
  transaction_reference: string;

  @Column({ type: 'varchar', length: 20 })
  status: string; // 'pending', 'completed', 'failed', 'cancelled'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ name: 'balance_before', type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance_before: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance_after: number;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at: Date;
}
