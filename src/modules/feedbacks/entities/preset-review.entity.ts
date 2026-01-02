import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';

@Entity('preset_reviews')
export class PresetReview extends BaseEntity {
  @Column({ name: 'merchant_id', nullable: true })
  merchant_id: number | null;

  @Column({ type: 'text' })
  review_text: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_system_default: boolean; // True for system-provided, false for merchant custom

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;
}
