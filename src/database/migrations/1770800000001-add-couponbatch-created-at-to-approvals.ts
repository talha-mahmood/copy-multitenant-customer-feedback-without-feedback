import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCouponbatchCreatedAtToApprovals1770800000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'couponbatch_created_at',
                type: 'timestamp',
                isNullable: true,
            }),
        );

        await queryRunner.query(`
            UPDATE approvals
            SET couponbatch_created_at = ad_created_at
            WHERE approval_type = 'homepage_coupon_push'
              AND couponbatch_created_at IS NULL
              AND ad_created_at IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('approvals', 'couponbatch_created_at');
    }
}
