import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateMerchantAnalyticsTable1770600000000 implements MigrationInterface {
    name = 'CreateMerchantAnalyticsTable1770600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'merchant_analytics',
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
                        name: 'admin_id',
                        type: 'int',
                    },
                    {
                        name: 'paid_ad_id',
                        type: 'int',
                    },
                    {
                        name: 'impressions',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'clicks',
                        type: 'int',
                        default: 0,
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

        // Create unique index on merchant_id, admin_id, paid_ad_id combination
        await queryRunner.createIndex(
            'merchant_analytics',
            new TableIndex({
                name: 'IDX_merchant_analytics_unique',
                columnNames: ['merchant_id', 'admin_id', 'paid_ad_id'],
                isUnique: true,
            }),
        );

        // Create individual indexes for better query performance
        await queryRunner.createIndex(
            'merchant_analytics',
            new TableIndex({
                name: 'IDX_merchant_analytics_merchant_id',
                columnNames: ['merchant_id'],
            }),
        );

        await queryRunner.createIndex(
            'merchant_analytics',
            new TableIndex({
                name: 'IDX_merchant_analytics_admin_id',
                columnNames: ['admin_id'],
            }),
        );

        await queryRunner.createIndex(
            'merchant_analytics',
            new TableIndex({
                name: 'IDX_merchant_analytics_paid_ad_id',
                columnNames: ['paid_ad_id'],
            }),
        );

        // Create foreign key constraints
        await queryRunner.createForeignKey(
            'merchant_analytics',
            new TableForeignKey({
                columnNames: ['merchant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'merchants',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'merchant_analytics',
            new TableForeignKey({
                columnNames: ['admin_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'admins',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        const table = await queryRunner.getTable('merchant_analytics');
        
        if (table) {
            const merchantForeignKey = table.foreignKeys.find(
                fk => fk.columnNames.indexOf('merchant_id') !== -1,
            );
            const adminForeignKey = table.foreignKeys.find(
                fk => fk.columnNames.indexOf('admin_id') !== -1,
            );

            if (merchantForeignKey) {
                await queryRunner.dropForeignKey('merchant_analytics', merchantForeignKey);
            }
            if (adminForeignKey) {
                await queryRunner.dropForeignKey('merchant_analytics', adminForeignKey);
            }
        }

        // Drop indexes
        await queryRunner.dropIndex('merchant_analytics', 'IDX_merchant_analytics_paid_ad_id');
        await queryRunner.dropIndex('merchant_analytics', 'IDX_merchant_analytics_admin_id');
        await queryRunner.dropIndex('merchant_analytics', 'IDX_merchant_analytics_merchant_id');
        await queryRunner.dropIndex('merchant_analytics', 'IDX_merchant_analytics_unique');

        // Drop table
        await queryRunner.dropTable('merchant_analytics');
    }
}
