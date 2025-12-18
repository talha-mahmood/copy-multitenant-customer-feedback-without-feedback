import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Column({ nullable: true }) avatar: string;
  @Exclude() @Column() password: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}
