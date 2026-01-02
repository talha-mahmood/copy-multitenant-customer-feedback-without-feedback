import { DataSource } from 'typeorm';

export async function seedMerchantSettings(dataSource: DataSource) {
  console.log('🌱 Seeding merchant settings...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Get all merchants that don't have settings
    const merchantsWithoutSettings = await queryRunner.query(`
      SELECT m.id 
      FROM merchants m 
      LEFT JOIN merchant_settings ms ON m.id = ms.merchant_id 
      WHERE ms.id IS NULL AND m.deleted_at IS NULL
    `);

    console.log(`Found ${merchantsWithoutSettings.length} merchants without settings`);

    // Create default settings for each merchant
    for (const merchant of merchantsWithoutSettings) {
      await queryRunner.query(`
        INSERT INTO merchant_settings (
          merchant_id, 
          enable_preset_reviews, 
          enable_google_reviews, 
          enable_facebook_reviews, 
          enable_instagram_reviews, 
          enable_xiaohongshu_reviews,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [merchant.id, true, true, false, false, false]);

      console.log(`✓ Created settings for merchant ID ${merchant.id}`);
    }

    console.log('✅ Merchant settings seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding merchant settings:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
