import { Column, Entity, CreateDateColumn } from 'typeorm';
import { SystemLogCategory, SystemLogAction, SystemLogLevel } from 'src/common/enums/system-log.enum';

@Entity('system_logs')
export class SystemLog {
  @Column({ type: 'int', primary: true, generated: true })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  category: SystemLogCategory;

  @Column({ type: 'varchar', length: 50 })
  action: SystemLogAction;

  @Column({ type: 'varchar', length: 20, default: SystemLogLevel.INFO })
  level: SystemLogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  user_type: string; // super_admin, admin, merchant, customer

  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string; // merchant, coupon, campaign, etc.

  @Column({ type: 'int', nullable: true })
  entity_id: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
}
