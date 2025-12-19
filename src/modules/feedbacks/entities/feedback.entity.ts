import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';

@Entity('feedbacks')
export class Feedback extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @Column() customerId: number;

  @Column({ type: 'int' }) rating: number; // 1-5

  @Column({ type: 'text', nullable: true }) comment: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
