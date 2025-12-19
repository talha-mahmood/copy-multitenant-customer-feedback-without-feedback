import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateWalletTransactionsTable1747600000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'wallet_transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'admin_wallet_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'merchant_wallet_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'credits',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'credit_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'transaction_reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
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
          },
          {
            name: 'balance_before',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'balance_after',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'completed_at',
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

    // Add foreign keys
    await queryRunner.createForeignKey(
      'wallet_transactions',
      new TableForeignKey({
        columnNames: ['admin_wallet_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'admin_wallets',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'wallet_transactions',
      new TableForeignKey({
        columnNames: ['merchant_wallet_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchant_wallets',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('wallet_transactions');

    if (table) {
      const adminForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('admin_wallet_id') !== -1,
      );
      if (adminForeignKey) {
        await queryRunner.dropForeignKey('wallet_transactions', adminForeignKey);
      }

      const merchantForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_wallet_id') !== -1,
      );
      if (merchantForeignKey) {
        await queryRunner.dropForeignKey('wallet_transactions', merchantForeignKey);
      }
    }

    await queryRunner.dropTable('wallet_transactions');
  }
}
