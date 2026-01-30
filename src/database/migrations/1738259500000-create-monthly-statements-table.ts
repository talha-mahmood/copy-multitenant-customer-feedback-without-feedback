import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMonthlyStatementsTable1738259500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'monthly_statements',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
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
          {
            name: 'owner_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'owner_id',
            type: 'int',
          },
          {
            name: 'year',
            type: 'int',
          },
          {
            name: 'month',
            type: 'int',
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'statement_data',
            type: 'jsonb',
          },
          {
            name: 'pdf_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'generated'",
          },
          {
            name: 'generated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'viewed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_monthly_statements_owner ON monthly_statements(owner_type, owner_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_monthly_statements_period ON monthly_statements(year, month);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_monthly_statements_unique ON monthly_statements(owner_type, owner_id, year, month) WHERE deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('monthly_statements');
  }
}
