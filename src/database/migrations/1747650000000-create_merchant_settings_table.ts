import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMerchantSettingsTable1747650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'merchant_settings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'merchant_id',
            type: 'int',
          },
          {
            name: 'enable_preset_reviews',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enable_google_reviews',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enable_facebook_reviews',
            type: 'boolean',
            default: false,
          },
          {
            name: 'enable_instagram_reviews',
            type: 'boolean',
            default: false,
          },
          {
            name: 'enable_xiaohongshu_reviews',
            type: 'boolean',
            default: false,
          },
          {
            name: 'google_review_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'facebook_page_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'instagram_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'xiaohongshu_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'merchant_settings',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('merchant_settings');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('merchant_settings', foreignKey);
      }
    }
    await queryRunner.dropTable('merchant_settings');
  }
}
