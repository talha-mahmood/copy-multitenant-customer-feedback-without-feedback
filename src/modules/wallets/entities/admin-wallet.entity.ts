import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('admin_wallets')
export class AdminWallet extends BaseEntity {
  @Column({ name: 'admin_id', unique: true })
  admin_id: number;

  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'total_earnings', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_earnings: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_spent: number;

  @Column({ name: 'pending_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_amount: number;

  @Column({ type: 'varchar', length: 10, default: 'MYR' })
  currency: string;

  @Column({ name: 'subscription_type', type: 'varchar', length: 20, default: 'annual' })
  subscription_type: string; // 'annual' by default for admins

  @Column({ name: 'subscription_expires_at', type: 'timestamp', nullable: true })
  subscription_expires_at: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.admin_wallet)
  transactions: WalletTransaction[];
}
