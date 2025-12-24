import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('coupon_templates')
export class CouponTemplate extends BaseEntity {
  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'type', length: 20 }) // 'annual' or 'temporary'
  type: string;

  @Column({ name: 'html', type: 'text' })
  html: string;
}
