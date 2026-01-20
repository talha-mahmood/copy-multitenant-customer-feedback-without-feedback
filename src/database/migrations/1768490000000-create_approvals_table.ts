import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateApprovalsTable1768490000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'approvals',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'merchant_id',
                        type: 'int',
                    },
                    {
                        name: 'paid_ad_placement',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'paid_ad_image',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'approval_status',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'admin_id',
                        type: 'int',
                        isNullable: true,
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

        // Foreign key for merchant_id
        await queryRunner.createForeignKey(
            'approvals',
            new TableForeignKey({
                columnNames: ['merchant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'merchants',
                onDelete: 'CASCADE',
            }),
        );

        // Foreign key for admin_id
        await queryRunner.createForeignKey(
            'approvals',
            new TableForeignKey({
                columnNames: ['admin_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'admins',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('approvals');
        if (table) {
            // Drop merchant_id foreign key
            const merchantForeignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
            );
            if (merchantForeignKey) {
                await queryRunner.dropForeignKey('approvals', merchantForeignKey);
            }

            // Drop admin_id foreign key
            const adminForeignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('admin_id') !== -1,
            );
            if (adminForeignKey) {
                await queryRunner.dropForeignKey('approvals', adminForeignKey);
            }
        }
        await queryRunner.dropTable('approvals');
    }
}
