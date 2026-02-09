import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCommissionFieldsToSuperAdminWallet1770380000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add revenue_admin_annual_subscription_fee column
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'revenue_admin_annual_subscription_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
      }),
    );

    // Add commission_temporary_merchant_packages column
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'commission_temporary_merchant_packages',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
      }),
    );

    // Add  q column
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'commission_annual_merchant_packages',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
      }),
    );

    // Add commission_merchant_annual_fee column
    await queryRunner.addColumn(
      'super_admin_wallets',
      new TableColumn({
        name: 'commission_merchant_annual_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('super_admin_wallets', 'commission_merchant_annual_fee');
    await queryRunner.dropColumn('super_admin_wallets', 'commission_annual_merchant_packages');
    await queryRunner.dropColumn('super_admin_wallets', 'commission_temporary_merchant_packages');
    await queryRunner.dropColumn('super_admin_wallets', 'revenue_admin_annual_subscription_fee');
  }
}
