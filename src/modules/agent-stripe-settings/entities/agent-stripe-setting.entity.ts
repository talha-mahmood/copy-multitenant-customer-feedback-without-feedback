import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';

@Entity('agent_stripe_settings')
export class AgentStripeSetting extends BaseEntity {
    @Column({ name: 'admin_id' })
    admin_id: number;

    @OneToOne(() => Admin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin;

    @Column({ name: 'publishable_key', type: 'text' })
    publishable_key: string;

    @Column({ name: 'secret_key', type: 'text' })
    secret_key: string;

    @Column({ name: 'webhook_secret', type: 'text', nullable: true })
    webhook_secret: string | null;
}
