import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdminIdToCreditPackages1748000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'credit_packages',
      new TableColumn({
        name: 'admin_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('credit_packages', 'admin_id');
  }
}
