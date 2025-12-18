import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWhatsAppTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create whatsapp_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_conversations',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'whatsapp_conversation_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'whatsapp_user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'contact_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
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

    // Create whatsapp_messages table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_messages',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'whatsapp_message_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'conversation_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'whatsapp_conversation_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'media_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'media_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'media_filename',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'media_mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'media_size',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'sent'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            isNullable: false,
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

    // Create whatsapp_webhooks table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_webhooks',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'webhook_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'processing_error',
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

    // Create whatsapp_templates table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_templates',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'template_name',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'template_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'en'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'components',
            type: 'jsonb',
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

    // Add foreign key constraint for whatsapp_messages
    await queryRunner.query(`
      ALTER TABLE whatsapp_messages 
      ADD CONSTRAINT FK_whatsapp_messages_conversation 
      FOREIGN KEY (conversation_id) 
      REFERENCES whatsapp_conversations(id) 
      ON DELETE CASCADE
    `);

    // Create indexes for better performance
    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_phone_number',
        columnNames: ['phone_number'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_whatsapp_user_id',
        columnNames: ['whatsapp_user_id'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_conversation_id',
        columnNames: ['conversation_id'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_direction',
        columnNames: ['direction'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_webhooks',
      new TableIndex({
        name: 'IDX_whatsapp_webhooks_processed',
        columnNames: ['processed'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_webhooks',
      new TableIndex({
        name: 'IDX_whatsapp_webhooks_event_type',
        columnNames: ['event_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE whatsapp_messages 
      DROP CONSTRAINT IF EXISTS FK_whatsapp_messages_conversation
    `);

    // Drop tables in reverse order
    await queryRunner.dropTable('whatsapp_templates');
    await queryRunner.dropTable('whatsapp_webhooks');
    await queryRunner.dropTable('whatsapp_messages');
    await queryRunner.dropTable('whatsapp_conversations');
  }
}
