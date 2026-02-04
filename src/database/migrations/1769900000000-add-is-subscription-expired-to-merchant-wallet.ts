import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsSubscriptionExpiredToMerchantWallet1769900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'merchant_wallets',
            new TableColumn({
                name: 'is_subscription_expired',
                type: 'boolean',
                default: false,
                comment: 'Indicates if the merchant subscription has expired',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('merchant_wallets', 'is_subscription_expired');
    }
}
