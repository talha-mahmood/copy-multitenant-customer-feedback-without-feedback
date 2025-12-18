import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';
import { getTimestampColumns } from './migration-columns/timestamp-columns';

export class CreateWhatsAppSessionsTable1757741096774 implements MigrationInterface {
  name = 'CreateWhatsAppSessionsTable1757741096774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_sessions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'current_step',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'complaint_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'last_activity',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          ...getTimestampColumns(),
        ],
      }),
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'whatsapp_sessions',
      new TableIndex({
        name: 'IDX_whatsapp_sessions_phone_number',
        columnNames: ['phone_number'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_sessions',
      new TableIndex({
        name: 'IDX_whatsapp_sessions_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_sessions',
      new TableIndex({
        name: 'IDX_whatsapp_sessions_last_activity',
        columnNames: ['last_activity'],
      }),
    );

    // Create composite index for active sessions by phone number
    await queryRunner.createIndex(
      'whatsapp_sessions',
      new TableIndex({
        name: 'IDX_whatsapp_sessions_phone_active',
        columnNames: ['phone_number', 'is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('whatsapp_sessions', 'IDX_whatsapp_sessions_phone_active');
    await queryRunner.dropIndex('whatsapp_sessions', 'IDX_whatsapp_sessions_last_activity');
    await queryRunner.dropIndex('whatsapp_sessions', 'IDX_whatsapp_sessions_active');
    await queryRunner.dropIndex('whatsapp_sessions', 'IDX_whatsapp_sessions_phone_number');

    // Drop table
    await queryRunner.dropTable('whatsapp_sessions');
  }
}
