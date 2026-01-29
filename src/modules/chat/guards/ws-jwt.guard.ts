import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private logger: Logger = new Logger('WsJwtGuard');

    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const token = this.extractTokenFromHeader(client);

            if (!token) {
                throw new WsException('Unauthorized access');
            }

            const payload = await this.jwtService.verifyAsync(token);
            // Attach the user to the socket object (mapping sub to id for consistency)
            client['user'] = {
                ...payload,
                id: payload.sub,
            };

            return true;
        } catch (err) {
            this.logger.error(`WS Authentication failed: ${err.message}`);
            throw new WsException('Unauthorized access');
        }
    }

    private extractTokenFromHeader(client: Socket): string | undefined {
        // Check both handshake auth and query parameters
        const token = client.handshake.auth?.token || client.handshake.query?.token;
        return Array.isArray(token) ? token[0] : token;
    }
}
