import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('credit_packages')
export class CreditPackage extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ name: 'credit_type', type: 'varchar', length: 20 })
  credit_type: string; // 'marketing', 'utility', 'general'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'price_per_credit', type: 'decimal', precision: 10, scale: 4 })
  price_per_credit: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'merchant_type', type: 'varchar', length: 20, nullable: true })
  merchant_type: string; // 'annual', 'temporary', 'all'

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;

  @Column({ name: 'bonus_credits', type: 'int', default: 0 })
  bonus_credits: number;
}
