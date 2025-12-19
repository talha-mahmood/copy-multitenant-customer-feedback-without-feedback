import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCreditPackagesTable1747600000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'credit_packages',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'credits',
            type: 'int',
          },
          {
            name: 'credit_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'price_per_credit',
            type: 'decimal',
            precision: 10,
            scale: 4,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'MYR'",
          },
          {
            name: 'merchant_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
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
            name: 'bonus_credits',
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

    // Insert default credit packages
    await queryRunner.query(`
      INSERT INTO credit_packages (name, description, credits, credit_type, price, price_per_credit, merchant_type, sort_order)
      VALUES
      -- Annual Merchant Packages
      ('Starter Package', '100 marketing messages', 100, 'marketing', 50.00, 0.50, 'annual', 1),
      ('Basic Package', '500 marketing messages', 500, 'marketing', 225.00, 0.45, 'annual', 2),
      ('Professional Package', '1000 marketing messages', 1000, 'marketing', 400.00, 0.40, 'annual', 3),
      ('Enterprise Package', '5000 marketing messages', 5000, 'marketing', 1750.00, 0.35, 'annual', 4),
      
      ('Utility Starter', '500 utility messages', 500, 'utility', 75.00, 0.15, 'annual', 5),
      ('Utility Basic', '1000 utility messages', 1000, 'utility', 120.00, 0.12, 'annual', 6),
      ('Utility Pro', '5000 utility messages', 5000, 'utility', 500.00, 0.10, 'annual', 7),
      
      -- Temporary Merchant Packages (Higher rates)
      ('Temp Starter', '50 general messages', 50, 'general', 15.00, 0.30, 'temporary', 8),
      ('Temp Basic', '100 general messages', 100, 'general', 28.00, 0.28, 'temporary', 9),
      ('Temp Pro', '200 general messages', 200, 'general', 52.00, 0.26, 'temporary', 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('credit_packages');
  }
}
    