import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { Conversation, ConversationType, ConversationCategory } from './entities/conversation.entity';
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
        if (role === 'super_admin' || role === 'support_staff') {
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
        } else if (role === 'support_staff') {
            // Support staff can see all conversations like super_admin
            query.where('conversation.super_admin_id IS NOT NULL OR conversation.super_admin_id IS NULL');
        } else if ((role === 'admin' || role === 'agent') && adminId) {
            query.where('conversation.agent_id = :adminId', { adminId });
        } else if (role === 'merchant' && merchantId) {
            query.where('conversation.merchant_id = :merchantId', { merchantId });
        } else {
            if (role === 'super_admin' || role === 'support_staff') {
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
                category: ConversationCategory.CHAT,
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

        // Update conversation for sorting and tracking
        conversation.updated_at = new Date();
        conversation.last_message = content;
        conversation.last_message_at = new Date();
        conversation.is_read = false;
        await this.conversationRepository.save(conversation);

        return savedMessage;
    }

    validateParticipant(conversation: Conversation, userId: number, role: string, superAdminId?: number, adminId?: number, merchantId?: number) {
        let isParticipant = false;

        if (role === 'super_admin' && superAdminId) {
            isParticipant = conversation.super_admin_id === superAdminId;
        } else if (role === 'support_staff') {
            // Support staff can access all conversations like super_admin
            isParticipant = true;
        } else if ((role === 'admin' || role === 'agent') && adminId) {
            isParticipant = conversation.agent_id === adminId;
        } else if (role === 'merchant' && merchantId) {
            isParticipant = conversation.merchant_id === merchantId;
        } else {
            isParticipant =
                (role === 'super_admin' && conversation.super_admin_id === userId) ||
                (role === 'support_staff') ||
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

    // Support Inbox Methods
    async createSupportConversation(user: any, message: string, imageUrl?: string) {
        let conversationType: ConversationType;
        let superAdminId: number | null = null;
        let adminId: number;
        let merchantId: number | null = null;

        // Determine conversation type based on user role
        if (user.role === 'admin') {
            // Agent contacting main platform
            conversationType = ConversationType.SUPERADMIN_AGENT;
            superAdminId = 1; // Static super admin ID
            adminId = user.adminId;
        } else if (user.role === 'merchant') {
            // Merchant contacting their agent
            conversationType = ConversationType.AGENT_MERCHANT;
            const merchant = await this.merchantRepository.findOne({
                where: { id: user.merchantId },
            });
            if (!merchant || !merchant.admin_id) {
                throw new NotFoundException('Agent not found for this merchant');
            }
            adminId = merchant.admin_id;
            merchantId = user.merchantId;
        } else {
            throw new ForbiddenException('Invalid user role for support');
        }

        // Create conversation
        const conversationData: any = {
            type: conversationType,
            category: ConversationCategory.SUPPORT,
            super_admin_id: superAdminId,
            agent_id: adminId,
            merchant_id: merchantId,
            last_message: message,
            last_message_at: new Date(),
            is_read: false,
        };
        
        const conversation = this.conversationRepository.create(conversationData);

        const savedConversation = await this.conversationRepository.save(conversation) as unknown as Conversation;

        // Create first message
        const firstMessage = this.messageRepository.create({
            conversation_id: savedConversation.id,
            sender_id: user.role === 'admin' ? user.adminId : user.merchantId,
            sender_role: user.role,
            sender_name: user.name || 'User',
            content: message,
            image_url: imageUrl,
            is_read: false,
        });

        await this.messageRepository.save(firstMessage);

        return savedConversation;
    }

    async getSupportInbox(user: any) {
        const query = this.conversationRepository
            .createQueryBuilder('conversation')
            .where('conversation.category = :category', { category: ConversationCategory.SUPPORT })
            .leftJoinAndSelect('conversation.agent', 'agent')
            .leftJoinAndSelect('agent.user', 'agentUser')
            .leftJoinAndSelect('conversation.merchant', 'merchant')
            .leftJoinAndSelect('merchant.user', 'merchantUser')
            .leftJoinAndSelect('conversation.super_admin', 'super_admin')
            .leftJoinAndSelect('super_admin.user', 'superAdminUser')
            .orderBy('conversation.last_message_at', 'DESC');

        // Apply data isolation based on user role
        if (user.role === 'super_admin' || user.role === 'support_staff') {
            // Main platform and support staff can see agent messages (SUPERADMIN_AGENT)
            query.andWhere(
                'conversation.type = :agentType',
                { agentType: ConversationType.SUPERADMIN_AGENT }
            );
        } else if (user.role === 'admin') {
            // Agent can see:
            // 1. Their own messages to platform
            // 2. Messages from their merchants
            query.andWhere(
                '(conversation.agent_id = :adminId)',
                { adminId: user.adminId }
            );
        } else if (user.role === 'merchant') {
            // Merchant can only see their own conversations
            query.andWhere(
                'conversation.merchant_id = :merchantId',
                { merchantId: user.merchantId }
            );
        } else {
            throw new ForbiddenException('Unauthorized');
        }

        return await query.getMany();
    }

    async sendSupportMessage(user: any, conversationId: number, message: string, imageUrl?: string) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.category !== ConversationCategory.SUPPORT) {
            throw new ForbiddenException('This is not a support conversation');
        }

        // Validate access
        this.validateSupportAccess(user, conversation);

        const senderId = this.getSenderId(user);
        if (!senderId) {
            throw new ForbiddenException('Invalid user');
        }

        // Create message
        const newMessage = this.messageRepository.create({
            conversation_id: conversationId,
            sender_id: senderId,
            sender_role: user.role,
            sender_name: user.name || 'Support',
            content: message,
            image_url: imageUrl,
            is_read: false,
        });

        await this.messageRepository.save(newMessage);

        // Update conversation
        conversation.last_message = message;
        conversation.last_message_at = new Date();
        conversation.is_read = false;
        await this.conversationRepository.save(conversation);

        return newMessage;
    }

    async getSupportMessages(user: any, conversationId: number) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['agent', 'merchant', 'super_admin'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.category !== ConversationCategory.SUPPORT) {
            throw new ForbiddenException('This is not a support conversation');
        }

        // Validate access
        this.validateSupportAccess(user, conversation);

        // Get messages
        const messages = await this.messageRepository.find({
            where: { conversation_id: conversationId },
            order: { created_at: 'ASC' },
        });

        // Mark as read
        if (!conversation.is_read) {
            conversation.is_read = true;
            await this.conversationRepository.save(conversation);
        }

        await this.messageRepository.update(
            { conversation_id: conversationId, is_read: false },
            { is_read: true }
        );

        return {
            conversation,
            messages,
        };
    }

    private validateSupportAccess(user: any, conversation: Conversation): void {
        let hasAccess = false;

        if (user.role === 'super_admin' || user.role === 'support_staff') {
            // Platform and support staff can access agent messages only
            hasAccess = conversation.type === ConversationType.SUPERADMIN_AGENT;
        } else if (user.role === 'admin') {
            // Agent can access their own conversations
            hasAccess = conversation.agent_id === user.adminId;
        } else if (user.role === 'merchant') {
            // Merchant can only access their own
            hasAccess = conversation.merchant_id === user.merchantId;
        }

        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this conversation');
        }
    }

    private getSenderId(user: any): number | null {
        if (user.role === 'super_admin' || user.role === 'support_staff') return user.superAdminId || user.supportStaffId || 1;
        if (user.role === 'admin') return user.adminId;
        if (user.role === 'merchant') return user.merchantId;
        return null;
    }
}
