import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFestivalMessagesTable1769700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'festival_messages',
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
            isNullable: false,
          },
          {
            name: 'festival_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'festival_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_recurring',
            type: 'boolean',
            default: true,
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
      'festival_messages',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('festival_messages');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('festival_messages', foreignKey);
      }
    }
    await queryRunner.dropTable('festival_messages');
  }
}
