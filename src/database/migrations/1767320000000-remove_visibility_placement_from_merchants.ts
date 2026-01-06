import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveVisibilityPlacementFromMerchants1767320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and remove from merchants table
    const merchantsTable = await queryRunner.getTable('merchants');
    
    if (merchantsTable) {
      const visibilityLogicColumn = merchantsTable.findColumnByName('visibility_logic');
      if (visibilityLogicColumn) {
        await queryRunner.dropColumn('merchants', 'visibility_logic');
      }

      const placementColumn = merchantsTable.findColumnByName('placement');
      if (placementColumn) {
        await queryRunner.dropColumn('merchants', 'placement');
      }
    }

    // Check and remove from merchant_settings table
    const merchantSettingsTable = await queryRunner.getTable('merchant_settings');
    
    if (merchantSettingsTable) {
      const visibilityLogicColumn = merchantSettingsTable.findColumnByName('visibility_logic');
      if (visibilityLogicColumn) {
        await queryRunner.dropColumn('merchant_settings', 'visibility_logic');
      }

      const placementColumn = merchantSettingsTable.findColumnByName('placement');
      if (placementColumn) {
        await queryRunner.dropColumn('merchant_settings', 'placement');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back to merchants table
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'visibility_logic',
        type: 'int',
        isNullable: true,
        default: null,
      }),
    );

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

    // Add back to merchant_settings table
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'visibility_logic',
        type: 'int',
        isNullable: true,
        default: null,
      }),
    );

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
  }
}
