import { DataSource } from 'typeorm';

export async function creditPackagesSeeder(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  try {
    // Check if credit packages already exist
    const existingPackages = await queryRunner.query(
      'SELECT COUNT(*) as count FROM credit_packages',
    );

    if (existingPackages[0].count > 0) {
      console.log('Credit packages already seeded, skipping...');
      return;
    }

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

    console.log('Credit packages seeded successfully!');
  } catch (error) {
    console.error('Error seeding credit packages:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
