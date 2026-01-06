import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { PresetReview } from './preset-review.entity';

@Entity('feedbacks')
export class Feedback extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @Column({ name: 'customer_id' })
  customer_id: number;

  @Column({ type: 'int' }) 
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true }) 
  comment: string;

  @Column({ name: 'review_type', length: 20, nullable: true })
  review_type: string; // 'preset' or 'custom'

  @Column({ name: 'preset_review_id', nullable: true })
  preset_review_id: number | null;

  @Column({ name: 'selected_platform', length: 50, nullable: true })
  selected_platform: string; // 'google', 'facebook', 'instagram', 'xiaohongshu'

  @Column({ name: 'redirect_completed', default: false })
  redirect_completed: boolean;

  @Column({ name: 'review_text', type: 'text', nullable: true })
  review_text: string; // Stores preset or custom review text

  @Column({ name: 'coupon_batch_id', type: 'int', nullable: true })
  coupon_batch_id: number | null;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => PresetReview, { nullable: true })
  @JoinColumn({ name: 'preset_review_id' })
  presetReview: PresetReview;
}
