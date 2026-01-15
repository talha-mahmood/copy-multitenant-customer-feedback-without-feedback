import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaidAdPlacementToMerchantSettings1768480000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("merchant_settings", new TableColumn({
            name: "paid_ad_placement",
            type: "text",
            isNullable: true,
            default: "'top'"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("merchant_settings", "paid_ad_placement");
    }

}
