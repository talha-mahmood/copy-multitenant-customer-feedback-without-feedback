import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Coupon } from 'src/modules/coupons/entities/coupon.entity';
import { WhatsAppMessageType, WhatsAppMessageStatus, WhatsAppCampaignType } from 'src/common/enums/whatsapp-message-type.enum';

@Entity('whatsapp_messages')
export class WhatsAppMessage extends BaseEntity {
  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'customer_id', nullable: true })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'coupon_id', nullable: true })
  coupon_id: number;

  @ManyToOne(() => Coupon, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'message_type', type: 'varchar', length: 10 })
  message_type: WhatsAppMessageType; // 'UI' or 'BI'

  @Column({ name: 'campaign_type', type: 'varchar', length: 50, nullable: true })
  campaign_type: WhatsAppCampaignType; // 'birthday', 'inactive_recall', 'festival', 'custom'

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ name: 'message_id', type: 'varchar', length: 255, nullable: true })
  message_id: string; // WhatsApp API message ID

  @Column({ type: 'varchar', length: 20, default: WhatsAppMessageStatus.PENDING })
  status: WhatsAppMessageStatus;

  @Column({ name: 'credits_deducted', type: 'int', default: 0 })
  credits_deducted: number; // Number of credits used

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  delivered_at: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  read_at: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failed_at: Date;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'text', nullable: true })
  message_content: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON string for additional data
}
