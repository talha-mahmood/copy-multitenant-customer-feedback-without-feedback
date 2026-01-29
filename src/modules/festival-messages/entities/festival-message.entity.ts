import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Entity('festival_messages')
export class FestivalMessage extends BaseEntity {
  @Column({ name: 'merchant_id', type: 'int' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'festival_name', type: 'varchar', length: 100 })
  festival_name: string;

  @Column({ name: 'festival_date', type: 'date' })
  festival_date: Date;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'is_recurring', type: 'boolean', default: true })
  is_recurring: boolean; // If true, repeats every year on the same date
}
