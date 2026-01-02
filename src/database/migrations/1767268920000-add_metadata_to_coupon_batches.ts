import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMetadataToCouponBatches1767268920000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("coupon_batches", [
            new TableColumn({
                name: "header",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "title",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "description",
                type: "text",
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("coupon_batches", "description");
        await queryRunner.dropColumn("coupon_batches", "title");
        await queryRunner.dropColumn("coupon_batches", "header");
    }

}
