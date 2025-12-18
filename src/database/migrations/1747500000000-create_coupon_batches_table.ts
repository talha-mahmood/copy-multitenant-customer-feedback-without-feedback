import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCouponBatchesTable1747500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'coupon_batches',
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
            name: 'batchName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'batchType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'annual or temporary',
          },
          {
            name: 'totalQuantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'issuedQuantity',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'startDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'endDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'couponTemplateId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'whatsappEnabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'luckyDrawEnabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
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

    await queryRunner.createForeignKey(
      'coupon_batches',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('coupon_batches');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('coupon_batches', foreignKey);
      }
    }
    await queryRunner.dropTable('coupon_batches');
  }
}
