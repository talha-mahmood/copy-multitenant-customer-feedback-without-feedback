import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBrandImageToCouponBatches1770000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'coupon_batches',
            new TableColumn({
                name: 'brand_image',
                type: 'text',
                isNullable: true,
                comment: 'The URL or path for the brand logo to be displayed on coupons',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('coupon_batches', 'brand_image');
    }
}
