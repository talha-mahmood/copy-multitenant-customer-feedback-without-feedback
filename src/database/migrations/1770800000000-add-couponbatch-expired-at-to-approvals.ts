import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCouponbatchExpiredAtToApprovals1770800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'couponbatch_expired_at',
                type: 'timestamp',
                isNullable: true,
            }),
        );

        await queryRunner.query(`
            UPDATE approvals
            SET couponbatch_expired_at = ad_expired_at
            WHERE approval_type = 'homepage_coupon_push'
              AND couponbatch_expired_at IS NULL
              AND ad_expired_at IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('approvals', 'couponbatch_expired_at');
    }
}
