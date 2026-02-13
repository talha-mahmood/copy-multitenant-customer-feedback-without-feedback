import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateSuperAdminSettingsAddPlatformCosts1770500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old commission rate columns
    await queryRunner.dropColumn('super_admin_settings', 'temporary_merchant_packages_admin_commission_rate');
    await queryRunner.dropColumn('super_admin_settings', 'annual_merchant_packages_admin_commission_rate');
    await queryRunner.dropColumn('super_admin_settings', 'annual_merchant_subscription_admin_commission_rate');

    // Add new platform cost columns
    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'merchant_annual_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 299.00,
        comment: 'Platform cost deducted from agent wallet when merchant registers annual',
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'whatsapp_bi_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0.45,
        comment: 'Platform cost per WhatsApp BI (Business-Initiated) message',
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'whatsapp_ui_annual_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0.12,
        comment: 'Platform cost per WhatsApp UI message for annual merchants',
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'whatsapp_ui_temporary_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0.12,
        comment: 'Platform cost per WhatsApp UI message for temporary merchants',
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'coupon_annual_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0.05,
        comment: 'Platform cost per coupon credit for annual merchants',
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'coupon_temporary_platform_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0.05,
        comment: 'Platform cost per coupon credit for temporary merchants',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new columns
    await queryRunner.dropColumn('super_admin_settings', 'merchant_annual_platform_cost');
    await queryRunner.dropColumn('super_admin_settings', 'whatsapp_bi_platform_cost');
    await queryRunner.dropColumn('super_admin_settings', 'whatsapp_ui_annual_platform_cost');
    await queryRunner.dropColumn('super_admin_settings', 'whatsapp_ui_temporary_platform_cost');
    await queryRunner.dropColumn('super_admin_settings', 'coupon_annual_platform_cost');
    await queryRunner.dropColumn('super_admin_settings', 'coupon_temporary_platform_cost');

    // Add back old columns
    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'temporary_merchant_packages_admin_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.20,
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'annual_merchant_packages_admin_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.02,
      }),
    );

    await queryRunner.addColumn(
      'super_admin_settings',
      new TableColumn({
        name: 'annual_merchant_subscription_admin_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0.75,
      }),
    );
  }
}
