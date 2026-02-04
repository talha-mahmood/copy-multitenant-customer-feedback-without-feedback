import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { CouponBatch } from '../../coupon-batches/entities/coupon-batch.entity';

export enum TargetAudience {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FIRST_TIME = 'first_time',
  RETURNING = 'returning',
}

export enum CampaignStatus {
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ALL = 'all',
}

@Entity('scheduled_campaigns')
export class ScheduledCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'merchant_id' })
  merchant_id: number;

  @Column({ name: 'coupon_batch_id', nullable: true })
  coupon_batch_id: number;

  @Column({ name: 'campaign_name', length: 255 })
  campaign_name: string;

  @Column({ name: 'campaign_message', type: 'text' })
  campaign_message: string;

  @Column({ name: 'scheduled_date', type: 'timestamp' })
  scheduled_date: Date;

  @Column({
    name: 'target_audience',
    type: 'enum',
    enum: TargetAudience,
    default: TargetAudience.ALL,
  })
  target_audience: TargetAudience;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.SCHEDULED,
  })
  status: CampaignStatus;

  @Column({ name: 'total_customers', default: 0 })
  total_customers: number;

  @Column({ name: 'messages_sent', default: 0 })
  messages_sent: number;

  @Column({ name: 'messages_failed', default: 0 })
  messages_failed: number;

  @Column({ name: 'send_coupons', default: false })
  send_coupons: boolean;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date;

  @ManyToOne(() => Merchant, { eager: false })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => CouponBatch, { eager: false })
  @JoinColumn({ name: 'coupon_batch_id' })
  coupon_batch: CouponBatch;
}
