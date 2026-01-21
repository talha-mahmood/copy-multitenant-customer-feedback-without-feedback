import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCommissionRatesToSuperAdminWallet1768700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add temporary merchant commission rate (default 20%)
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'temporary_merchant_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.20,
        comment: 'Commission rate for temporary merchant credit purchases (e.g., 0.20 = 20%)',
      }),
    );

    // Add annual merchant commission rate (default 2%)
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'annual_merchant_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.02,
        comment: 'Commission rate for annual merchant credit purchases (e.g., 0.02 = 2%)',
      }),
    );

    // Add merchant annual subscription fee (default 1199.00)
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'merchant_annual_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 1199.00,
        comment: 'Annual subscription fee for merchants',
      }),
    );

    // Add admin commission rate for annual merchant upgrades (default 75%)
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'admin_annual_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.75,
        comment: 'Commission rate admin receives when merchant upgrades to annual (e.g., 0.75 = 75%)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('super_admin_wallets', 'admin_annual_commission_rate');
    await queryRunner.dropColumn('super_admin_wallets', 'merchant_annual_fee');
    await queryRunner.dropColumn('super_admin_wallets', 'annual_merchant_commission_rate');
    await queryRunner.dropColumn('super_admin_wallets', 'temporary_merchant_commission_rate');
  }
}
