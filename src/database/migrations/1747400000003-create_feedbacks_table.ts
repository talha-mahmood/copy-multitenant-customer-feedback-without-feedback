import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFeedbacksTable1747400000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'feedbacks',
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
            name: 'customerId',
            type: 'int',
          },
          {
            name: 'rating',
            type: 'int',
          },
          {
            name: 'comment',
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

    // Add foreign key for merchant_id
    await queryRunner.createForeignKey(
      'feedbacks',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for customerId
    await queryRunner.createForeignKey(
      'feedbacks',
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('feedbacks');
    
    if (table) {
      const foreignKeyMerchant = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      const foreignKeyCustomer = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('customerId') !== -1,
      );

      if (foreignKeyMerchant) {
        await queryRunner.dropForeignKey('feedbacks', foreignKeyMerchant);
      }
      if (foreignKeyCustomer) {
        await queryRunner.dropForeignKey('feedbacks', foreignKeyCustomer);
      }
    }

    await queryRunner.dropTable('feedbacks');
  }
}
