import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSupportFieldsToMessages1748000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sender_name column
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'sender_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add image_url column
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'image_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'image_url');
    await queryRunner.dropColumn('messages', 'sender_name');
  }
}
