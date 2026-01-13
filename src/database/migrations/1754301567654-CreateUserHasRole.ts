import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";
import { getTimestampColumns } from "src/database/migrations/migration-columns/timestamp-columns";

export class CreateUserHasRole1754301567654 implements MigrationInterface {
    name = 'CreateUserHasRole1754301567654'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_has_role',
                columns: [
                    { name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                    { name: 'role_id', type: 'bigint', isNullable: false },
                    { name: 'user_id', type: 'bigint', isNullable: false },
                    ...getTimestampColumns(),
                ],
            })
        );

        await queryRunner.createForeignKey(
            'user_has_role',
            new TableForeignKey({
                columnNames: ['role_id'],
                referencedTableName: 'roles',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
        await queryRunner.createForeignKey(
            'user_has_role',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user_has_role');
    }
}
