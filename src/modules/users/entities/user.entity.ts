import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Column() avatar: string;
  @Exclude() @Column() password: string;
  @Column({ name: 'is_active', default: true }) is_active: boolean;
}
