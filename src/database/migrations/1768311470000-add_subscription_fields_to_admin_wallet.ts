import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionFieldsToAdminWallet1768311470000 implements MigrationInterface {
    name = 'AddSubscriptionFieldsToAdminWallet1768311470000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "admin_wallets" 
            ADD COLUMN "subscription_type" character varying(20) NOT NULL DEFAULT 'annual'
        `);
        
        await queryRunner.query(`
            ALTER TABLE "admin_wallets" 
            ADD COLUMN "subscription_expires_at" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "admin_wallets" 
            DROP COLUMN "subscription_expires_at"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "admin_wallets" 
            DROP COLUMN "subscription_type"
        `);
    }
}
