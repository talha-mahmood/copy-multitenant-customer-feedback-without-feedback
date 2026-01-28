import { Column, Entity, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { AgentStripeSetting } from 'src/modules/agent-stripe-settings/entities/agent-stripe-setting.entity';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @OneToMany(() => Merchant, (merchant) => merchant.admin)
  merchants: Merchant[];

  @OneToOne(() => AgentStripeSetting, (setting) => setting.admin)
  stripe_settings: AgentStripeSetting;
}
