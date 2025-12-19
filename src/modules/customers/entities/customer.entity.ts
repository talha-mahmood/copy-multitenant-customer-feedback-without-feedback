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

  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Exclude() @Column() password: string;
  @Column({ default: true }) isActive: boolean;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ length: 20, nullable: true })
  gender: string;
}
