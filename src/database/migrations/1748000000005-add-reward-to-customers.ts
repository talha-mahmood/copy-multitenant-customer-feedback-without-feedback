import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRewardToCustomers1748000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'reward',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customers', 'reward');
  }
}
