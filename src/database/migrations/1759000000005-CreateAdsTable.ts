import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAdsTable1759000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ads',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'link_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'draft', 'archived'],
            default: "'active'",
          },
          {
            name: 'position',
            type: 'enum',
            enum: [
              'front-top-left',
              'front-top-center',
              'front-top-right',
              'front-middle-left',
              'front-middle-center',
              'front-middle-right',
              'front-bottom-left',
              'front-bottom-center',
              'front-bottom-right',
              'back-top-left',
              'back-top-center',
              'back-top-right',
              'back-middle-left',
              'back-middle-center',
              'back-middle-right',
              'back-bottom-left',
              'back-bottom-center',
              'back-bottom-right',
              'sidebar-left',
              'sidebar-right',
              'header',
              'footer',
              'popup',
              'banner',
            ],
            default: "'front-top-center'",
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'click_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'view_count',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ads');
  }
}
