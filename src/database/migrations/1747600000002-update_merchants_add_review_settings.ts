import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateMerchantsAddReviewSettings1747600000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'enable_preset_reviews',
        type: 'boolean',
        default: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'google_review_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'facebook_page_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'instagram_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'xiaohongshu_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'enable_google_reviews',
        type: 'boolean',
        default: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'enable_facebook_reviews',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'enable_instagram_reviews',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'enable_xiaohongshu_reviews',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchants', 'enable_xiaohongshu_reviews');
    await queryRunner.dropColumn('merchants', 'enable_instagram_reviews');
    await queryRunner.dropColumn('merchants', 'enable_facebook_reviews');
    await queryRunner.dropColumn('merchants', 'enable_google_reviews');
    await queryRunner.dropColumn('merchants', 'xiaohongshu_url');
    await queryRunner.dropColumn('merchants', 'instagram_url');
    await queryRunner.dropColumn('merchants', 'facebook_page_url');
    await queryRunner.dropColumn('merchants', 'google_review_url');
    await queryRunner.dropColumn('merchants', 'enable_preset_reviews');
  }
}
