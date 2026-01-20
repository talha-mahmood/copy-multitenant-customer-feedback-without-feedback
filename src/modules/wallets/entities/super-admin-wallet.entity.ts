import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { SuperAdmin } from 'src/modules/super-admins/entities/super-admin.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('super_admin_wallets')
export class SuperAdminWallet extends BaseEntity {
  @Column({ name: 'super_admin_id', unique: true })
  super_admin_id: number;

  @ManyToOne(() => SuperAdmin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'super_admin_id' })
  superAdmin: SuperAdmin;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'total_earnings', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_earnings: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_spent: number;

  @Column({ name: 'pending_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'admin_subscription_fee', type: 'decimal', precision: 10, scale: 2, default: 1199.00 })
  admin_subscription_fee: number; // Fee for admin annual subscription

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.super_admin_wallet)
  transactions: WalletTransaction[];
}
