import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';
import { getTimestampColumns } from './migration-columns/timestamp-columns';

export class CreateSocialAuthenticationsTable1747378623508
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'social_authentications',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'device',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'bigint',
            isNullable: false,
          },
          ...getTimestampColumns(),
        ],
      }),
    );

    // Add foreign key constraint for user_id
    await queryRunner.createForeignKey(
      'social_authentications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('social_authentications');
  }
}
