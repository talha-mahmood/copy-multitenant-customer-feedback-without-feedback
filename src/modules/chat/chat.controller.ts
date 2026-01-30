import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SkipSubscription } from 'src/common/decorators/skip-subscription.decorator';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
@SkipSubscription()
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversations')
    async getConversations(@Request() req) {
        return await this.chatService.findUserConversations(
            req.user.id,
            req.user.role,
            req.user.superAdminId,
            req.user.adminId,
            req.user.merchantId
        );
    }

    @Get('contacts')
    async getContacts(@Request() req) {
        return await this.chatService.getContacts(
            req.user.id,
            req.user.role,
            req.user.superAdminId,
            req.user.adminId,
            req.user.merchantId
        );
    }

    @Get('conversations/:id/messages')
    async getMessages(
        @Param('id') id: string,
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Request() req
    ) {
        return await this.chatService.getConversationMessages(
            +id,
            req.user.id,
            req.user.role,
            page ? +page : 1,
            limit ? +limit : 20,
            req.user.superAdminId,
            req.user.adminId,
            req.user.merchantId
        );
    }
}
