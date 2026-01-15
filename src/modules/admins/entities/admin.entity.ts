import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @OneToMany(() => Merchant, (merchant) => merchant.admin)
  merchants: Merchant[];
}
