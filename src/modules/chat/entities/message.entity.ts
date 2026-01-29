import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message extends BaseEntity {
    @Column({ name: 'conversation_id' })
    conversation_id: number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Column({ name: 'sender_id' })
    sender_id: number;

    @Column({ name: 'sender_role' })
    sender_role: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'is_read', default: false })
    is_read: boolean;
}
