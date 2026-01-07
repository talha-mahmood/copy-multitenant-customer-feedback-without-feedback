import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPlacementToMerchantSettingsAndMerchants1767320000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add placement column to merchant_settings table
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'placement',
        type: 'varchar',
        length: '255',
        isNullable: true,
        default: null,
      }),
    );

    // Add placement column to merchants table
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'placement',
        type: 'varchar',
        length: '255',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove placement column from merchants table
    await queryRunner.dropColumn('merchants', 'placement');

    // Remove placement column from merchant_settings table
    await queryRunner.dropColumn('merchant_settings', 'placement');
  }
}
