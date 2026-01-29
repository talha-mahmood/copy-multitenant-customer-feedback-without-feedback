import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

/**
 * Credits Ledger (Bank-Style Accounting Record)
 * Every credit movement must create a ledger entry
 * This is the foundation for Monthly PDF Statements
 */
@Entity('credits_ledger')
export class CreditsLedger extends BaseEntity {
  @Column({ name: 'owner_type', type: 'varchar', length: 20 })
  owner_type: string; // 'merchant', 'admin', 'master'

  @Column({ name: 'owner_id', type: 'int' })
  owner_id: number;

  @Column({ name: 'credit_type', type: 'varchar', length: 20 })
  credit_type: string; // 'coupon', 'whatsapp_ui', 'whatsapp_bi', 'paid_ads'

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'purchase', 'deduct', 'refund', 'adjustment'

  @Column({ type: 'int' })
  amount: number; // (+/-) credits

  @Column({ name: 'balance_before', type: 'int' })
  balance_before: number;

  @Column({ name: 'balance_after', type: 'int' })
  balance_after: number;

  @Column({ name: 'related_object_type', type: 'varchar', length: 50, nullable: true })
  related_object_type: string; // 'coupon_batch', 'coupon', 'whatsapp_message', 'ad', 'package'

  @Column({ name: 'related_object_id', type: 'int', nullable: true })
  related_object_id: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON string for additional data
}
