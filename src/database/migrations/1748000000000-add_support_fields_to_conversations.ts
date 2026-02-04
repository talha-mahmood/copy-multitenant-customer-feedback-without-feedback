import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSupportFieldsToConversations1748000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add category enum column
    await queryRunner.query(`
      ALTER TABLE conversations 
      ADD COLUMN category ENUM('support', 'chat') DEFAULT 'chat' AFTER type
    `);

    // Add last_message column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'last_message',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add last_message_at column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'last_message_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add is_read column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'is_read',
        type: 'boolean',
        default: false,
      }),
    );

    // Add index for better performance
    await queryRunner.query(`
      CREATE INDEX IDX_CONVERSATION_CATEGORY ON conversations(category)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_CONVERSATION_LAST_MESSAGE_AT ON conversations(last_message_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_CONVERSATION_LAST_MESSAGE_AT ON conversations`);
    await queryRunner.query(`DROP INDEX IDX_CONVERSATION_CATEGORY ON conversations`);
    await queryRunner.dropColumn('conversations', 'is_read');
    await queryRunner.dropColumn('conversations', 'last_message_at');
    await queryRunner.dropColumn('conversations', 'last_message');
    await queryRunner.dropColumn('conversations', 'category');
  }
}
