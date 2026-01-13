import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSubscriptionFieldsToAdminWallet1768311470000 implements MigrationInterface {
    name = 'AddSubscriptionFieldsToAdminWallet1768311470000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('admin_wallets', new TableColumn({
            name: 'subscription_type',
            type: 'varchar',
            length: '20',
            default: "'annual'",
        }));
        
        await queryRunner.addColumn('admin_wallets', new TableColumn({
            name: 'subscription_expires_at',
            type: 'timestamp',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('admin_wallets', 'subscription_expires_at');
        await queryRunner.dropColumn('admin_wallets', 'subscription_type');
    }
}
