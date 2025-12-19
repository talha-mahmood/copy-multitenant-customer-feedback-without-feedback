import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQrCodeImageToMerchants1747500000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'qr_code_image',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchants', 'qr_code_image');
  }
}
