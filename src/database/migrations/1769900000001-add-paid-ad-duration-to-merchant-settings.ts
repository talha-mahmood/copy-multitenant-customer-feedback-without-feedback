import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaidAdDurationToMerchantSettings1769900000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("merchant_settings", new TableColumn({
            name: "paid_ad_duration",
            type: "int",
            isNullable: false,
            default: 7
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("merchant_settings", "paid_ad_duration");
    }

}
