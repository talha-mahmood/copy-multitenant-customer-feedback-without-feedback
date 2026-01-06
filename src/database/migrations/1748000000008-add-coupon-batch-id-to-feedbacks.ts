import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCouponBatchIdToFeedbacks1748000000008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'coupon_batch_id',
        type: 'integer',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('feedbacks', 'coupon_batch_id');
  }
}
