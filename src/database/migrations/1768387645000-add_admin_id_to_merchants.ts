import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddAdminIdToMerchants1768387645000 implements MigrationInterface {
    name = 'AddAdminIdToMerchants1768387645000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'merchants',
            new TableColumn({
                name: 'admin_id',
                type: 'int',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'merchants',
            new TableForeignKey({
                columnNames: ['admin_id'],
                referencedTableName: 'admins',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('merchants');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('admin_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('merchants', foreignKey);
            }
            await queryRunner.dropColumn('merchants', 'admin_id');
        }
    }
}
