import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBrandImageToCouponBatchesAndCoupons1770380000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add brand_image column to coupon_batches table
        await queryRunner.addColumn("coupon_batches", new TableColumn({
            name: "brand_image",
            type: "varchar",
            length: "255",
            isNullable: true // Existing records (if any) will have null
        }));

        // Add brand_image column to coupons table
        await queryRunner.addColumn("coupons", new TableColumn({
            name: "brand_image",
            type: "varchar",
            length: "255",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("coupons", "brand_image");
        await queryRunner.dropColumn("coupon_batches", "brand_image");
    }

}
