import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHomepagePlacementSettingsToSuperAdminSettings1770700000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add homepage_coupon_placement_cost column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'homepage_coupon_placement_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 50.00,
        }));

        // Add homepage_ad_placement_cost column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'homepage_ad_placement_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 100.00,
        }));

        // Add max_homepage_coupons column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'max_homepage_coupons',
            type: 'int',
            default: 10,
        }));

        // Add max_homepage_ads column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'max_homepage_ads',
            type: 'int',
            default: 4,
        }));

        // Add coupon_homepage_placement_duration_days column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'coupon_homepage_placement_duration_days',
            type: 'int',
            default: 7,
        }));

        // Add ad_homepage_placement_duration_days column
        await queryRunner.addColumn('super_admin_settings', new TableColumn({
            name: 'ad_homepage_placement_duration_days',
            type: 'int',
            default: 7,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('super_admin_settings', 'ad_homepage_placement_duration_days');
        await queryRunner.dropColumn('super_admin_settings', 'coupon_homepage_placement_duration_days');
        await queryRunner.dropColumn('super_admin_settings', 'max_homepage_ads');
        await queryRunner.dropColumn('super_admin_settings', 'max_homepage_coupons');
        await queryRunner.dropColumn('super_admin_settings', 'homepage_ad_placement_cost');
        await queryRunner.dropColumn('super_admin_settings', 'homepage_coupon_placement_cost');
    }
}
