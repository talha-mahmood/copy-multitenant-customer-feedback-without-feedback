import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMessagesTable1748000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'conversation_id',
            type: 'int',
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
            name: 'message',
            type: 'text',
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
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
            name: 'IDX_MESSAGE_CONVERSATION',
            columnNames: ['conversation_id'],
          },
          {
            name: 'IDX_MESSAGE_SENDER',
            columnNames: ['sender_id', 'sender_type'],
          },
          {
            name: 'IDX_MESSAGE_CREATED_AT',
            columnNames: ['created_at'],
          },
        ],
      }),
      true,
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('messages');
    const foreignKey = table.foreignKeys.find(
      fk => fk.columnNames.indexOf('conversation_id') !== -1,
    );
    await queryRunner.dropForeignKey('messages', foreignKey);
    await queryRunner.dropTable('messages');
  }
}
