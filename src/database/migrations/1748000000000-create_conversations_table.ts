import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateConversationsTable1748000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['agent_to_platform', 'main_merchant_to_platform', 'agent_merchant_to_agent'],
          },
          {
            name: 'sender_id',
            type: 'int',
          },
          {
            name: 'sender_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'sender_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'receiver_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'receiver_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'last_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
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
        indices: [
          {
            name: 'IDX_CONVERSATION_TYPE',
            columnNames: ['type'],
          },
          {
            name: 'IDX_CONVERSATION_SENDER',
            columnNames: ['sender_id', 'sender_type'],
          },
          {
            name: 'IDX_CONVERSATION_RECEIVER',
            columnNames: ['receiver_id', 'receiver_type'],
          },
          {
            name: 'IDX_CONVERSATION_LAST_MESSAGE_AT',
            columnNames: ['last_message_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversations');
  }
}
