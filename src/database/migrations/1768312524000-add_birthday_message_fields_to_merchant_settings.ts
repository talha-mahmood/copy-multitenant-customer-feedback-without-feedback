import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBirthdayMessageFieldsToMerchantSettings1768312524000 implements MigrationInterface {
    name = 'AddBirthdayMessageFieldsToMerchantSettings1768312524000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('merchant_settings', new TableColumn({
            name: 'birthday_message_enabled',
            type: 'boolean',
            default: false,
        }));

        await queryRunner.addColumn('merchant_settings', new TableColumn({
            name: 'days_before_birthday',
            type: 'int',
            default: 0,
        }));

        await queryRunner.addColumn('merchant_settings', new TableColumn({
            name: 'days_after_birthday',
            type: 'int',
            default: 0,
        }));

        await queryRunner.addColumn('merchant_settings', new TableColumn({
            name: 'birthday_coupon_batch_id',
            type: 'int',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('merchant_settings', 'birthday_coupon_batch_id');
        await queryRunner.dropColumn('merchant_settings', 'days_after_birthday');
        await queryRunner.dropColumn('merchant_settings', 'days_before_birthday');
        await queryRunner.dropColumn('merchant_settings', 'birthday_message_enabled');
    }
}
