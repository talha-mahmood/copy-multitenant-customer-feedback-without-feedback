import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaidAdVideoToMerchantSettings1770400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'paid_ad_video',
        type: 'text',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'paid_ad_video_status',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchant_settings', 'paid_ad_video_status');
    await queryRunner.dropColumn('merchant_settings', 'paid_ad_video');
  }
}
