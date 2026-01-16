import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveAdminIdFromCreditPackages1768500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before dropping it
    const table = await queryRunner.getTable('credit_packages');
    const adminIdColumn = table?.findColumnByName('admin_id');
    
    if (adminIdColumn) {
      await queryRunner.dropColumn('credit_packages', 'admin_id');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'credit_packages',
      new TableColumn({
        name: 'admin_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }
}
