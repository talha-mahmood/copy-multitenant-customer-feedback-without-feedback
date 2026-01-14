import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSuperAdminsTable1768385963000 implements MigrationInterface {
    name = 'CreateSuperAdminsTable1768385963000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'super_admins',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
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
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'user_id',
                        type: 'int',
                    },
                    {
                        name: 'address',
                        type: 'text',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'super_admins',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('super_admins');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('super_admins', foreignKey);
            }
        }
        await queryRunner.dropTable('super_admins');
    }
}
