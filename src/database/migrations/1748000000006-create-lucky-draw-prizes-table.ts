import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLuckyDrawPrizesTable1748000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lucky_draw_prizes',
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
          },
          {
            name: 'batch_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'prize_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'prize_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'prize_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'probability',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'daily_limit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'total_limit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'daily_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
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
      'lucky_draw_prizes',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'lucky_draw_prizes',
      new TableForeignKey({
        columnNames: ['batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupon_batches',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('lucky_draw_prizes');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('lucky_draw_prizes', fk);
      }
    }
    await queryRunner.dropTable('lucky_draw_prizes');
  }
}
