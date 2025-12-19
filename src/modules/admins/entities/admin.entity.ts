import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Column({ nullable: true }) avatar: string;
  @Exclude() @Column() password: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}
