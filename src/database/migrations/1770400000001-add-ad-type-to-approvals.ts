import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdTypeToApprovals1770400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'approvals',
      new TableColumn({
        name: 'ad_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('approvals', 'ad_type');
  }
}
