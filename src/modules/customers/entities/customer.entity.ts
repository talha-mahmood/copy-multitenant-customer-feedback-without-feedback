import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

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

}
