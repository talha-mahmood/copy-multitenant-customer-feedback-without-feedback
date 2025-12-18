import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { getTimestampColumns } from './migration-columns/timestamp-columns';

export class CreateCountriesTable1747378707138 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'countries',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '10',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'phone_code',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          ...getTimestampColumns(),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('countries');
  }
}
