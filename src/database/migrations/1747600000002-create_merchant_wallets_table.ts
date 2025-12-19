import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMerchantWalletsTable1747600000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'merchant_wallets',
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
            isUnique: true,
          },
          {
            name: 'message_credits',
            type: 'int',
            default: 0,
          },
          {
            name: 'marketing_credits',
            type: 'int',
            default: 0,
          },
          {
            name: 'utility_credits',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_credits_purchased',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_credits_used',
            type: 'int',
            default: 0,
          },
          {
            name: 'subscription_type',
            type: 'varchar',
            length: '20',
            default: "'temporary'",
          },
          {
            name: 'subscription_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'annual_fee_paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'MYR'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Add foreign key
    await queryRunner.createForeignKey(
      'merchant_wallets',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('merchant_wallets');

    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('merchant_wallets', foreignKey);
      }
    }

    await queryRunner.dropTable('merchant_wallets');
  }
}
