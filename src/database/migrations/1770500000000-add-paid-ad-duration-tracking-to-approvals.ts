import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaidAdDurationTrackingToApprovals1770500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add ad_created_at column
    await queryRunner.addColumn(
      'approvals',
      new TableColumn({
        name: 'ad_created_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Add ad_expired_at column
    await queryRunner.addColumn(
      'approvals',
      new TableColumn({
        name: 'ad_expired_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Add placement column
    await queryRunner.addColumn(
      'approvals',
      new TableColumn({
        name: 'placement',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('approvals', 'placement');
    await queryRunner.dropColumn('approvals', 'ad_expired_at');
    await queryRunner.dropColumn('approvals', 'ad_created_at');
  }
}
