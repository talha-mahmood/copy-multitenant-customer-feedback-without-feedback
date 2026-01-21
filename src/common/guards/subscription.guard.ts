import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { SKIP_SUBSCRIPTION_KEY } from '../decorators/skip-subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject('DATA_SOURCE')
        private dataSource: DataSource,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public or skip subscription
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        const skipSubscription = this.reflector.getAllAndOverride<boolean>(
            SKIP_SUBSCRIPTION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic || skipSubscription) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user; // From JWT

        // Only check for admin role
        if (!user || user.role !== 'admin') {
            return true;
        }

        // Check subscription status using adminId from JWT
        const adminWallet = await this.dataSource.query(
            `
      SELECT subscription_expires_at, is_subscription_expired 
      FROM admin_wallets 
      WHERE admin_id = $1
      LIMIT 1
    `,
            [user.adminId],
        );

        if (!adminWallet || adminWallet.length === 0) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'No subscription found',
                error: 'NO_SUBSCRIPTION',
                redirectTo: '/payment',
            });
        }

        // Check is_subscription_expired field (updated on every login)
        if (adminWallet[0].is_subscription_expired === true) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Subscription expired',
                error: 'SUBSCRIPTION_EXPIRED',
                redirectTo: '/payment',
            });
        }

        // Fallback: Check subscription_expires_at if null or past date
        // if (!adminWallet[0].subscription_expires_at) {
        //     throw new ForbiddenException({
        //         statusCode: 403,
        //         message: 'No subscription found',
        //         error: 'NO_SUBSCRIPTION',
        //         redirectTo: '/payment',
        //     });
        // }

        const expiryDate = new Date(adminWallet[0].subscription_expires_at);
        const now = new Date();

        if (expiryDate < now) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Subscription expired',
                error: 'SUBSCRIPTION_EXPIRED',
                redirectTo: '/payment',
            });
        }

        return true;
    }
}
