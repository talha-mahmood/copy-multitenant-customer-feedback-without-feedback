import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCityCountryToAdmins1768459336000 implements MigrationInterface {
    name = 'AddCityCountryToAdmins1768459336000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'admins',
            new TableColumn({
                name: 'city',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'admins',
            new TableColumn({
                name: 'country',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('admins', 'country');
        await queryRunner.dropColumn('admins', 'city');
    }
}
