import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWhatsappEnabledForBatchIdToMerchantSettings1748000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'whatsapp_enabled_for_batch_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchant_settings', 'whatsapp_enabled_for_batch_id');
  }
}
