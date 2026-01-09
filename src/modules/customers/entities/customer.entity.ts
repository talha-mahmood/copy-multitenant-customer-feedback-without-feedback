import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'merchant_id', type: 'int', nullable: true })
  merchant_id: number;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ name: 'reward', default: false })
  reward: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

}
