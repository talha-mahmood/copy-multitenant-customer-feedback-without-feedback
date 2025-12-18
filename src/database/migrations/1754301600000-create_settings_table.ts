import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { getTimestampColumns } from './migration-columns/timestamp-columns';

export class CreateSettingsTable1754301600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'input',
              'dropdown',
              'radio',
              'checkbox',
              'textarea',
              'select',
              'toggle',
              'date',
              'datetime',
              'time',
              'file',
              'image',
              'color',
              'range',
              'number',
              'email',
              'url',
              'password'
            ],
            default: "'input'",
            isNullable: false,
          },
          {
            name: 'options',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'values',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'group',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_required',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'validation_rules',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'default_value',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          ...getTimestampColumns(),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings');
  }
}
