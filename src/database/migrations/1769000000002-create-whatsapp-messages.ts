import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWhatsAppMessages1769000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            name: 'merchant_id',
            type: 'int',
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'coupon_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '10',
            comment: 'UI (User-Initiated) or BI (Business-Initiated)',
          },
          {
            name: 'campaign_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'birthday, inactive_recall, festival, custom',
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'WhatsApp API message ID',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            comment: 'pending, sent, delivered, read, failed',
          },
          {
            name: 'credits_deducted',
            type: 'int',
            default: 0,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'message_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
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

    // Foreign keys
    await queryRunner.createForeignKey(
      'whatsapp_messages',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'whatsapp_messages',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'whatsapp_messages',
      new TableForeignKey({
        columnNames: ['coupon_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupons',
        onDelete: 'SET NULL',
      }),
    );

    // Indexes for efficient querying
    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_merchant',
        columnNames: ['merchant_id'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_type',
        columnNames: ['message_type'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_messages',
      new TableIndex({
        name: 'IDX_whatsapp_messages_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('whatsapp_messages');
  }
}
