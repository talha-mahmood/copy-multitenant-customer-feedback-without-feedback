import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateFestivalCampaignsStructure1769800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add coupon_batch_id to festival_messages table
    await queryRunner.addColumn(
      'festival_messages',
      new TableColumn({
        name: 'coupon_batch_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // Add foreign key constraint for coupon_batch_id
    await queryRunner.query(`
      ALTER TABLE festival_messages 
      ADD CONSTRAINT fk_festival_messages_coupon_batch 
      FOREIGN KEY (coupon_batch_id) 
      REFERENCES coupon_batches(id) 
      ON DELETE SET NULL
    `);

    // Add scheduled_campaign_enabled to merchant_settings table
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'scheduled_campaign_enabled',
        type: 'boolean',
        default: false,
      }),
    );

    // Remove festival_coupon_batch_id from merchant_settings table
    await queryRunner.dropColumn('merchant_settings', 'festival_coupon_batch_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add festival_coupon_batch_id back to merchant_settings
    await queryRunner.addColumn(
      'merchant_settings',
      new TableColumn({
        name: 'festival_coupon_batch_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // Remove scheduled_campaign_enabled from merchant_settings
    await queryRunner.dropColumn('merchant_settings', 'scheduled_campaign_enabled');

    // Remove foreign key constraint from festival_messages
    await queryRunner.query(`
      ALTER TABLE festival_messages 
      DROP CONSTRAINT IF EXISTS fk_festival_messages_coupon_batch
    `);

    // Remove coupon_batch_id from festival_messages
    await queryRunner.dropColumn('festival_messages', 'coupon_batch_id');
  }
}
