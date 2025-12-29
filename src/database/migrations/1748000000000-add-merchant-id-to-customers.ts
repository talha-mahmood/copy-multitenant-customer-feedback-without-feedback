import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMerchantIdToCustomers1748000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('customers',
      new TableColumn({
        name: 'merchant_id',
        type: 'int',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customers', 'merchant_id');
  }
}
