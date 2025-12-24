import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCouponsTable1747500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'batch_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'merchant_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'coupon_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'qr_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'template_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'header',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'issued'",
            isNullable: false,
            comment: 'issued, redeemed, expired',
          },
          {
            name: 'issued_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'redeemed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'pdf_url',
            type: 'text',
            isNullable: true,
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

    // Foreign key for batch_id
    await queryRunner.createForeignKey(
      'coupons',
      new TableForeignKey({
        columnNames: ['batch_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'coupon_batches',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key for merchant_id
    await queryRunner.createForeignKey(
      'coupons',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key for customer_id
    await queryRunner.createForeignKey(
      'coupons',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('coupons');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(
        (fk) =>
          fk.columnNames.indexOf('batch_id') !== -1 ||
          fk.columnNames.indexOf('merchant_id') !== -1 ||
          fk.columnNames.indexOf('customer_id') !== -1,
      );
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('coupons', foreignKey);
      }
    }
    await queryRunner.dropTable('coupons');
  }
}
