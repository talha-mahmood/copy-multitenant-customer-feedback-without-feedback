import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFieldsToMerchants1748000000004 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("merchants", [
            new TableColumn({
                name: "visibility_logic",
                type: "int",
                isNullable: true,
                default: null
            }),
            new TableColumn({
                name: "placement",
                type: "varchar",
                length: "255",
                isNullable: true,
                default: null
            }),
            new TableColumn({
                name: "paid_ads",
                type: "boolean",
                default: false
            }),
            new TableColumn({
                name: "paid_ad_image",
                type: "text",
                isNullable: true,
                default: null
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("merchants", "paid_ad_image");
        await queryRunner.dropColumn("merchants", "paid_ads");
        await queryRunner.dropColumn("merchants", "placement");
        await queryRunner.dropColumn("merchants", "visibility_logic");
    }

}
