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
        if (!user) {
            return true;
        }

        if (user.role === 'admin') {
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
        }
        // Handle Merchant Subscription
        // else if (user.role === 'merchant') {
        //     const merchantWallet = await this.dataSource.query(
        //         `
        //         SELECT id, subscription_expires_at, subscription_type 
        //         FROM merchant_wallets 
        //         WHERE merchant_id = $1
        //         LIMIT 1
        //         `,
        //         [user.merchantId],
        //     );

        //     if (merchantWallet && merchantWallet.length > 0) {
        //         const wallet = merchantWallet[0];

        //         if (wallet.subscription_type === 'annual' && wallet.subscription_expires_at) {
        //             const expiryDate = new Date(wallet.subscription_expires_at);
        //             const now = new Date();

        //             if (expiryDate < now) {
        //                 // Auto-downgrade logic
        //                 await this.dataSource.query(
        //                     `
        //                     UPDATE merchant_wallets 
        //                     SET subscription_type = 'temporary', is_subscription_expired = true 
        //                     WHERE id = $1
        //                     `,
        //                     [wallet.id],
        //                 );

        //                 await this.dataSource.query(
        //                     `
        //                     UPDATE merchants 
        //                     SET merchant_type = 'temporary' 
        //                     WHERE id = $1
        //                     `,
        //                     [user.merchantId],
        //                 );

        //                 // Allow access as temporary merchant
        //             }
        //         }
        //     }
        // }

        return true;
    }
}
