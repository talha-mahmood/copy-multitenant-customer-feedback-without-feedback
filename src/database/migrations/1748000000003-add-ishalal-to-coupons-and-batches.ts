import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIshalalToCouponsAndBatches1748000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add ishalal column to coupon_batches table
    await queryRunner.addColumn(
      'coupon_batches',
      new TableColumn({
        name: 'ishalal',
        type: 'boolean',
        default: false,
      }),
    );

    // Add ishalal column to coupons table
    await queryRunner.addColumn(
      'coupons',
      new TableColumn({
        name: 'ishalal',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('coupons', 'ishalal');
    await queryRunner.dropColumn('coupon_batches', 'ishalal');
  }
}
