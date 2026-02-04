import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

@Entity('monthly_statements')
export class MonthlyStatement extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  owner_type: string; // 'merchant' | 'agent' | 'master'

  @Column({ type: 'int' })
  owner_id: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number; // 1-12

  @Column({ type: 'varchar', length: 200 })
  company_name: string;

  @Column({ type: 'jsonb' })
  statement_data: any; // Contains all statement details

  @Column({ type: 'text', nullable: true })
  pdf_url: string; // S3 or local path to generated PDF

  @Column({ type: 'varchar', length: 20, default: 'generated' })
  status: string; // 'generated' | 'sent' | 'viewed'

  @Column({ type: 'timestamp', nullable: true })
  generated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewed_at: Date;

  @ManyToOne(() => Merchant, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  merchant: Merchant;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  admin: Admin;
}
