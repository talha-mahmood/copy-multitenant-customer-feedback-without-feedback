import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMerchantFieldsToSettings1767300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'paid_ads',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'paid_ad_image',
        type: 'text',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchant_settings', 'paid_ad_image');
    await queryRunner.dropColumn('merchant_settings', 'paid_ads');
  }
}
