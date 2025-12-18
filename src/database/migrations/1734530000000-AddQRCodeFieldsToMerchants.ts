import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQRCodeFieldsToMerchants1734530000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'qr_code_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'qr_code_hash',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchants', 'qr_code_hash');
    await queryRunner.dropColumn('merchants', 'qr_code_url');
  }
}
