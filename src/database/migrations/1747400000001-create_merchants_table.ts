import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMerchantsTable1747400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'merchants',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'business_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'merchant_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'qr_code_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'qr_code_hash',
            type: 'varchar',
            length: '255',
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
      'merchants',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('merchants');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('merchants', foreignKey);
      }
    }
    await queryRunner.dropTable('merchants');
  }
}
