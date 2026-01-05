import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationFieldsToMerchants1748000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'city',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'country',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'map_link',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('merchants', 'latitude');
    await queryRunner.dropColumn('merchants', 'longitude');
    await queryRunner.dropColumn('merchants', 'map_link');
    await queryRunner.dropColumn('merchants', 'country');
    await queryRunner.dropColumn('merchants', 'city');
  }
}
