import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVisibilityAndPlacementToCouponBatches1767310000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'coupon_batches',
      new TableColumn({
        name: 'visibility',
        type: 'boolean',
        default: false,
      }),
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('coupon_batches', 'placement');
  }
}
