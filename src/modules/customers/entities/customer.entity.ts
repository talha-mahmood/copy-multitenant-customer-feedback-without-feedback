import { Column, Entity, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Exclude() @Column() password: string;
  @Column({ default: true }) isActive: boolean;
}
