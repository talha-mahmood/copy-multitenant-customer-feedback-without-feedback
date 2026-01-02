import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateFeedbacksAddReviewFields1747600000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'review_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'preset or custom',
      }),
    );

    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'preset_review_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'selected_platform',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'google, facebook, instagram, xiaohongshu',
      }),
    );

    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'redirect_completed',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'feedbacks',
      new TableColumn({
        name: 'review_text',
        type: 'text',
        isNullable: true,
        comment: 'Stores preset or custom review text',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('feedbacks', 'review_text');
    await queryRunner.dropColumn('feedbacks', 'redirect_completed');
    await queryRunner.dropColumn('feedbacks', 'selected_platform');
    await queryRunner.dropColumn('feedbacks', 'preset_review_id');
    await queryRunner.dropColumn('feedbacks', 'review_type');
  }
}
