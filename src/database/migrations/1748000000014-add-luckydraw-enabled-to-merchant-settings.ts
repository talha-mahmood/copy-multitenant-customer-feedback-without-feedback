import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLuckydrawEnabledToMerchantSettings1748000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'luckydraw_enabled',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchant_settings', 'luckydraw_enabled');
  }
}
