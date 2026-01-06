import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLuckyDrawResultsTable1748000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lucky_draw_results',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'customer_id',
            type: 'int',
          },
          {
            name: 'merchant_id',
            type: 'int',
          },
          {
            name: 'batch_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'prize_id',
            type: 'int',
          },
          {
            name: 'spin_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'is_claimed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'claimed_at',
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
      'lucky_draw_results',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'lucky_draw_results',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'lucky_draw_results',
      new TableForeignKey({
        columnNames: ['batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupon_batches',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'lucky_draw_results',
      new TableForeignKey({
        columnNames: ['prize_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lucky_draw_prizes',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('lucky_draw_results');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('lucky_draw_results', fk);
      }
    }
    await queryRunner.dropTable('lucky_draw_results');
  }
}
