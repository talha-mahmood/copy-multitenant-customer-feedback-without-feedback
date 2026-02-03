import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Admin } from '../admins/entities/admin.entity';
import { Merchant } from '../merchants/entities/merchant.entity';

@Injectable()
export class ChatService {
    constructor(
        @Inject('CONVERSATION_REPOSITORY')
        private conversationRepository: Repository<Conversation>,
        @Inject('MESSAGE_REPOSITORY')
        private messageRepository: Repository<Message>,
        @Inject('ADMIN_REPOSITORY')
        private adminRepository: Repository<Admin>,
        @Inject('MERCHANT_REPOSITORY')
        private merchantRepository: Repository<Merchant>,
    ) { }

    async getContacts(userId: number, role: string, superAdminId?: number, adminId?: number, merchantId?: number) {
        if (role === 'super_admin') {
            // Fetch all agents
            const agents = await this.adminRepository.find({
                relations: ['user'],
                where: { user: { is_active: true } }
            });
            return agents.map(agent => ({
                id: agent.id,
                name: agent.user.name,
                role: 'admin',
                avatar: agent.user.avatar,
                type: ConversationType.SUPERADMIN_AGENT
            }));
        } else if (role === 'admin' || role === 'agent') {
            // Fetch super admin (static) and own merchants
            const merchants = await this.merchantRepository.find({
                where: { admin_id: adminId }, // Fixed: agent_id -> admin_id
                relations: ['user']
            });

            const contacts = [
                {
                    id: 1, // Static SuperAdmin ID
                    name: "Super Admin",
                    role: 'super_admin',
                    type: ConversationType.SUPERADMIN_AGENT
                },
                ...merchants.map(m => ({
                    id: m.id,
                    name: m.user.name,
                    role: 'merchant',
                    avatar: m.user.avatar,
                    type: ConversationType.AGENT_MERCHANT
                }))
            ];
            return contacts;
        } else if (role === 'merchant') {
            // Fetch own agent (admin)
            const merchant = await this.merchantRepository.findOne({
                where: { id: merchantId },
                relations: ['admin', 'admin.user'] // Fixed: agent -> admin
            });

            if (merchant?.admin) {
                return [{
                    id: merchant.admin.id,
                    name: merchant.admin.user.name, // Fixed: agent -> admin
                    role: 'admin',
                    avatar: merchant.admin.user.avatar, // Fixed: agent -> admin
                    type: ConversationType.AGENT_MERCHANT
                }];
            }
            return [];
        }
        return [];
    }


    async findUserConversations(userId: number, role: string, superAdminId?: number, adminId?: number, merchantId?: number) {
        const query = this.conversationRepository.createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.messages', 'messages')
            .leftJoinAndSelect('conversation.agent', 'agent')
            .leftJoinAndSelect('agent.user', 'agentUser')
            .leftJoinAndSelect('conversation.merchant', 'merchant')
            .leftJoinAndSelect('merchant.user', 'merchantUser')
            .leftJoinAndSelect('conversation.super_admin', 'super_admin')
            .leftJoinAndSelect('super_admin.user', 'superAdminUser')
            .orderBy('conversation.updated_at', 'DESC')
            .addOrderBy('messages.created_at', 'ASC');

        if (role === 'super_admin' && superAdminId) {
            query.where('conversation.super_admin_id = :superAdminId', { superAdminId });
        } else if ((role === 'admin' || role === 'agent') && adminId) {
            query.where('conversation.agent_id = :adminId', { adminId });
        } else if (role === 'merchant' && merchantId) {
            query.where('conversation.merchant_id = :merchantId', { merchantId });
        } else {
            if (role === 'super_admin') {
                query.where('conversation.super_admin_id = :userId', { userId });
            } else if (role === 'admin' || role === 'agent') {
                query.where('conversation.agent_id = :userId', { userId });
            } else if (role === 'merchant') {
                query.where('conversation.merchant_id = :userId', { userId });
            }
        }

        return await query.getMany();
    }

    async findOrCreateConversation(payload: {
        type: ConversationType;
        superAdminId?: number;
        adminId?: number;
        merchantId?: number;
    }) {
        const where: any = {
            type: payload.type,
            super_admin_id: payload.superAdminId || IsNull(),
            agent_id: payload.adminId,
            merchant_id: payload.merchantId || IsNull(),
        };

        let conversation = await this.conversationRepository.findOne({ where });

        if (!conversation) {
            conversation = this.conversationRepository.create({
                type: payload.type,
                super_admin_id: payload.superAdminId,
                agent_id: payload.adminId,
                merchant_id: payload.merchantId,
            });
            conversation = await this.conversationRepository.save(conversation);
        }

        return conversation;
    }

    async getConversationMessages(conversationId: number, userId: number, role: string, page: number = 1, limit: number = 20, superAdminId?: number, adminId?: number, merchantId?: number) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        this.validateParticipant(conversation, userId, role, superAdminId, adminId, merchantId);

        return await this.messageRepository.find({
            where: { conversation_id: conversationId },
            order: { created_at: 'ASC' },
            take: limit,
            skip: (page - 1) * limit,
        });
    }

    async saveMessage(conversationId: number, senderId: number, senderRole: string, content: string, superAdminId?: number, adminId?: number, merchantId?: number) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        this.validateParticipant(conversation, senderId, senderRole, superAdminId, adminId, merchantId);

        const message = this.messageRepository.create({
            conversation_id: conversationId,
            sender_id: senderId,
            sender_role: senderRole,
            content,
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update conversation updated_at for sorting
        conversation.updated_at = new Date();
        await this.conversationRepository.save(conversation);

        return savedMessage;
    }

    validateParticipant(conversation: Conversation, userId: number, role: string, superAdminId?: number, adminId?: number, merchantId?: number) {
        let isParticipant = false;

        if (role === 'super_admin' && superAdminId) {
            isParticipant = conversation.super_admin_id === superAdminId;
        } else if ((role === 'admin' || role === 'agent') && adminId) {
            isParticipant = conversation.agent_id === adminId;
        } else if (role === 'merchant' && merchantId) {
            isParticipant = conversation.merchant_id === merchantId;
        } else {
            isParticipant =
                (role === 'super_admin' && conversation.super_admin_id === userId) ||
                ((role === 'admin' || role === 'agent') && conversation.agent_id === userId) ||
                (role === 'merchant' && conversation.merchant_id === userId);
        }

        if (!isParticipant) {
            throw new ForbiddenException('You are not a participant of this conversation');
        }
    }

    async findConversationById(id: number) {
        return await this.conversationRepository.findOne({
            where: { id },
            relations: ['agent', 'merchant', 'super_admin']
        });
    }
}
