import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { getTimestampColumns } from './migration-columns/timestamp-columns';

export class CreateSuperAdminSettingsTable1768720000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'super_admin_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'admin_subscription_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 1199.00,
            comment: 'Fee for admin annual subscription',
          },
          {
            name: 'temporary_merchant_commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.20,
            comment: 'Commission rate for temporary merchants (e.g., 0.20 = 20%)',
          },
          {
            name: 'annual_merchant_commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.02,
            comment: 'Commission rate for annual merchants (e.g., 0.02 = 2%)',
          },
          {
            name: 'merchant_annual_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 1199.00,
            comment: 'Annual subscription fee for merchants',
          },
          {
            name: 'admin_annual_commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.75,
            comment: 'Commission rate admin gets for merchant annual upgrades (e.g., 0.75 = 75%)',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
              ...getTimestampColumns(),
    
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('super_admin_settings');
  }
}


