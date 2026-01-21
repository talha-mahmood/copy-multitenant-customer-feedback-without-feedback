import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCommissionFieldsFromSuperAdminWallet1768720000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('super_admin_wallets', 'admin_subscription_fee');
    await queryRunner.dropColumn('super_admin_wallets', 'temporary_merchant_commission_rate');
    await queryRunner.dropColumn('super_admin_wallets', 'annual_merchant_commission_rate');
    await queryRunner.dropColumn('super_admin_wallets', 'merchant_annual_fee');
    await queryRunner.dropColumn('super_admin_wallets', 'admin_annual_commission_rate');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE super_admin_wallets
      ADD COLUMN admin_subscription_fee DECIMAL(10, 2) DEFAULT 1199.00,
      ADD COLUMN temporary_merchant_commission_rate DECIMAL(5, 4) DEFAULT 0.20,
      ADD COLUMN annual_merchant_commission_rate DECIMAL(5, 4) DEFAULT 0.02,
      ADD COLUMN merchant_annual_fee DECIMAL(10, 2) DEFAULT 1199.00,
      ADD COLUMN admin_annual_commission_rate DECIMAL(5, 4) DEFAULT 0.75
    `);
  }
}
