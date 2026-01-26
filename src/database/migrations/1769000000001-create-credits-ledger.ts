import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCreditsLedger1769000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'credits_ledger',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'owner_type',
            type: 'varchar',
            length: '20',
            comment: 'merchant, admin, or master',
          },
          {
            name: 'owner_id',
            type: 'int',
          },
          {
            name: 'credit_type',
            type: 'varchar',
            length: '20',
            comment: 'coupon, whatsapp_ui, whatsapp_bi, paid_ads',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            comment: 'purchase, deduct, refund, adjustment',
          },
          {
            name: 'amount',
            type: 'int',
            comment: 'Positive or negative credit amount',
          },
          {
            name: 'balance_before',
            type: 'int',
          },
          {
            name: 'balance_after',
            type: 'int',
          },
          {
            name: 'related_object_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'coupon_batch, coupon, whatsapp_message, ad, package',
          },
          {
            name: 'related_object_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
            comment: 'JSON string for additional data',
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

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'credits_ledger',
      new TableIndex({
        name: 'IDX_credits_ledger_owner',
        columnNames: ['owner_type', 'owner_id'],
      }),
    );

    await queryRunner.createIndex(
      'credits_ledger',
      new TableIndex({
        name: 'IDX_credits_ledger_credit_type',
        columnNames: ['credit_type'],
      }),
    );

    await queryRunner.createIndex(
      'credits_ledger',
      new TableIndex({
        name: 'IDX_credits_ledger_action',
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'credits_ledger',
      new TableIndex({
        name: 'IDX_credits_ledger_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('credits_ledger');
  }
}
