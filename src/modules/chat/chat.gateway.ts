import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConversationType } from './entities/conversation.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('ChatGateway');

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (token) {
                const payload = await this.jwtService.verifyAsync(token);
                const userId = payload.sub;
                const role = payload.role;

                // Join personal rooms
                client.join(`user_${userId}`);
                if (payload.superAdminId) client.join(`super_admin_${payload.superAdminId}`);
                if (payload.adminId) client.join(`agent_${payload.adminId}`);
                if (payload.merchantId) client.join(`merchant_${payload.merchantId}`);

                this.logger.log(`Client connected and joined personal rooms: ${client.id} (User: ${userId})`);
            } else {
                this.logger.log(`Client connected without token: ${client.id}`);
            }
        } catch (err) {
            this.logger.error(`Socket connection auth failed: ${err.message}`);
            // We don't disconnect here, guards will handle protected events
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('joinConversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: number },
    ) {
        const user = client['user'];
        const conversation = await this.chatService.findConversationById(data.conversationId);

        if (!conversation) {
            client.emit('error', { message: 'Conversation not found' });
            return;
        }

        try {
            this.chatService.validateParticipant(
                conversation,
                user.id,
                user.role,
                user.superAdminId,
                user.adminId,
                user.merchantId
            );
            const roomName = `conversation_${data.conversationId}`;
            client.join(roomName);
            this.logger.log(`User ${user.id} joined room ${roomName}`);
            client.emit('joinedRoom', { room: roomName });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId?: number; receiverId?: number; type?: ConversationType; content: string },
    ) {
        const user = client['user'];
        let conversationId = data.conversationId;

        try {
            // 1. Find or Create conversation if only receiverId is provided
            if (!conversationId && data.receiverId && data.type) {
                const convPayload: any = { type: data.type };
                if (data.type === ConversationType.SUPERADMIN_AGENT) {
                    if (user.role === 'super_admin') {
                        convPayload.superAdminId = user.superAdminId;
                        convPayload.adminId = data.receiverId;
                    } else {
                        convPayload.superAdminId = 1; // Enforce static SuperAdmin ID = 1
                        convPayload.adminId = user.adminId;
                    }
                } else { // AGENT_MERCHANT
                    if (user.role === 'admin' || user.role === 'agent') {
                        convPayload.adminId = user.adminId;
                        convPayload.merchantId = data.receiverId;
                    } else {
                        convPayload.adminId = data.receiverId;
                        convPayload.merchantId = user.merchantId;
                    }
                }
                const conversation = await this.chatService.findOrCreateConversation(convPayload);
                conversationId = conversation.id;
            }

            if (!conversationId) {
                throw new Error('Conversation ID or recipient details required');
            }

            // 2. Save Message
            const message = await this.chatService.saveMessage(
                conversationId,
                user.id,
                user.role,
                data.content,
                user.superAdminId,
                user.adminId,
                user.merchantId
            );

            // 3. Emit to rooms
            const convRoom = `conversation_${conversationId}`;
            const conversation = await this.chatService.findConversationById(conversationId);

            // Emit to both participants' personal rooms so their sidebars update
            const rooms = [convRoom];
            if (conversation) {
                if (conversation.super_admin_id) rooms.push(`super_admin_${conversation.super_admin_id}`);
                if (conversation.agent_id) rooms.push(`agent_${conversation.agent_id}`);
                if (conversation.merchant_id) rooms.push(`merchant_${conversation.merchant_id}`);
            }

            this.server.to(rooms).emit('newMessage', {
                ...message,
                conversationId // Ensure frontend knows which conversation this belongs to
            });

            this.logger.log(`Message from ${user.id} sent to rooms: ${rooms.join(', ')}`);
        } catch (error) {
            this.logger.error(`Send message failed: ${error.message}`);
            client.emit('error', { message: error.message });
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('getConversations')
    async handleGetConversations(
        @ConnectedSocket() client: Socket,
    ) {
        const user = client['user'];
        try {
            const conversations = await this.chatService.findUserConversations(
                user.id,
                user.role,
                user.superAdminId,
                user.adminId,
                user.merchantId
            );
            client.emit('conversations', conversations);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('getMessages')
    async handleGetMessages(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: number; page?: number; limit?: number },
    ) {
        const user = client['user'];
        try {
            const messages = await this.chatService.getConversationMessages(
                data.conversationId,
                user.id,
                user.role,
                data.page || 1,
                data.limit || 20,
                user.superAdminId,
                user.adminId,
                user.merchantId
            );
            client.emit('messages', {
                conversationId: data.conversationId,
                data: messages
            });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }
}
