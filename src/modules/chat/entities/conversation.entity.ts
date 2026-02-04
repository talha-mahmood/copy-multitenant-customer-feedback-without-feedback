import { Entity, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { SuperAdmin } from 'src/modules/super-admins/entities/super-admin.entity';
import { Admin } from 'src/modules/admins/entities/admin.entity';
import { Merchant } from 'src/modules/merchants/entities/merchant.entity';
import { Message } from './message.entity';

export enum ConversationType {
    SUPERADMIN_AGENT = 'SUPERADMIN_AGENT',
    AGENT_MERCHANT = 'AGENT_MERCHANT',
}

export enum ConversationCategory {
    SUPPORT = 'support',
    CHAT = 'chat',
}

@Entity('conversations')
export class Conversation extends BaseEntity {
    @Column({
        type: 'enum',
        enum: ConversationType,
    })
    type: ConversationType;

    @Column({
        type: 'enum',
        enum: ConversationCategory,
        default: ConversationCategory.CHAT,
    })
    category: ConversationCategory;

    @Column({ name: 'last_message', type: 'text', nullable: true })
    last_message: string;

    @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
    last_message_at: Date;

    @Column({ name: 'is_read', default: false })
    is_read: boolean;

    @Column({ name: 'super_admin_id', nullable: true })
    super_admin_id: number;

    @ManyToOne(() => SuperAdmin, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'super_admin_id' })
    super_admin: SuperAdmin;

    @Column({ name: 'agent_id' })
    agent_id: number;

    @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'agent_id' })
    agent: Admin;

    @Column({ name: 'merchant_id', nullable: true })
    merchant_id: number;

    @ManyToOne(() => Merchant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'merchant_id' })
    merchant: Merchant;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

}
