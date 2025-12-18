import { Column, Entity, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('merchants')
export class Merchant extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) phone: string;
  @Column({ type: 'text', nullable: true }) address: string;
  @Column({ length: 255 }) businessName: string;
  @Column({ length: 100 }) businessType: string;
  @Column({ length: 50 }) merchantType: string; // 'temporary' or 'permanent'
  @Column({ length: 100, nullable: true }) taxId: string;
  @Exclude() @Column() password: string;
  @Column({ default: true }) isActive: boolean;
}
