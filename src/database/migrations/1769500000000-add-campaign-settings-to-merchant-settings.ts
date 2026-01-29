import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCampaignSettingsToMerchantSettings1769500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add inactive customer recall settings
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'inactive_recall_enabled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'inactive_recall_days',
        type: 'int',
        default: 30,
        comment: 'Number of days of inactivity before sending recall message',
      }),
    );

    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'inactive_recall_coupon_batch_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // Add festival campaign settings
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'festival_campaign_enabled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'festival_coupon_batch_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchant_settings', 'festival_coupon_batch_id');
    await queryRunner.dropColumn('merchant_settings', 'festival_campaign_enabled');
    await queryRunner.dropColumn('merchant_settings', 'inactive_recall_coupon_batch_id');
    await queryRunner.dropColumn('merchant_settings', 'inactive_recall_days');
    await queryRunner.dropColumn('merchant_settings', 'inactive_recall_enabled');
  }
}
