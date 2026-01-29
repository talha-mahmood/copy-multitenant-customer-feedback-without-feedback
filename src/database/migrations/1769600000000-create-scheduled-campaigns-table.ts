import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateScheduledCampaignsTable1769600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scheduled_campaigns',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'merchant_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'coupon_batch_id',
            type: 'int',
            isNullable: true,
            comment: 'Optional: Coupon batch to assign coupons from',
          },
          {
            name: 'campaign_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'campaign_message',
            type: 'text',
            isNullable: false,
            comment: 'Custom message to send to customers',
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
            isNullable: false,
            comment: 'Date and time when campaign should be sent',
          },
          {
            name: 'target_audience',
            type: 'enum',
            enum: ['all', 'active', 'inactive', 'first_time', 'returning'],
            default: "'all'",
            comment: 'Target customer segment',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'processing', 'completed', 'cancelled', 'failed'],
            default: "'scheduled'",
          },
          {
            name: 'total_customers',
            type: 'int',
            default: 0,
            comment: 'Total customers targeted',
          },
          {
            name: 'messages_sent',
            type: 'int',
            default: 0,
            comment: 'Number of messages successfully sent',
          },
          {
            name: 'messages_failed',
            type: 'int',
            default: 0,
            comment: 'Number of messages failed',
          },
          {
            name: 'send_coupons',
            type: 'boolean',
            default: false,
            comment: 'Whether to send coupons with the message',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When campaign execution started',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When campaign execution completed',
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
      }),
      true,
    );

    // Add index on merchant_id
    await queryRunner.createIndex(
      'scheduled_campaigns',
      new TableIndex({
        name: 'IDX_SCHEDULED_CAMPAIGNS_MERCHANT_ID',
        columnNames: ['merchant_id'],
      }),
    );

    // Add index on scheduled_date for cron job queries
    await queryRunner.createIndex(
      'scheduled_campaigns',
      new TableIndex({
        name: 'IDX_SCHEDULED_CAMPAIGNS_SCHEDULED_DATE',
        columnNames: ['scheduled_date'],
      }),
    );

    // Add index on status
    await queryRunner.createIndex(
      'scheduled_campaigns',
      new TableIndex({
        name: 'IDX_SCHEDULED_CAMPAIGNS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Add foreign key for merchant_id
    await queryRunner.createForeignKey(
      'scheduled_campaigns',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for coupon_batch_id
    await queryRunner.createForeignKey(
      'scheduled_campaigns',
      new TableForeignKey({
        columnNames: ['coupon_batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupon_batches',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('scheduled_campaigns');
    
    if (!table) {
      return;
    }

    // Drop foreign keys
    const merchantForeignKey = table.foreignKeys.find(
      fk => fk.columnNames.indexOf('merchant_id') !== -1,
    );
    if (merchantForeignKey) {
      await queryRunner.dropForeignKey('scheduled_campaigns', merchantForeignKey);
    }

    const batchForeignKey = table.foreignKeys.find(
      fk => fk.columnNames.indexOf('coupon_batch_id') !== -1,
    );
    if (batchForeignKey) {
      await queryRunner.dropForeignKey('scheduled_campaigns', batchForeignKey);
    }

    await queryRunner.dropTable('scheduled_campaigns');
  }
}
