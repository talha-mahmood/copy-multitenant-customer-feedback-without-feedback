import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateSystemLogsTable1768465763000 implements MigrationInterface {
    name = 'CreateSystemLogsTable1768465763000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'system_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'level',
                        type: 'varchar',
                        length: '20',
                        default: "'info'",
                    },
                    {
                        name: 'message',
                        type: 'text',
                    },
                    {
                        name: 'user_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'user_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: 'super_admin, admin, merchant, customer',
                    },
                    {
                        name: 'entity_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: 'merchant, coupon, campaign, etc.',
                    },
                    {
                        name: 'entity_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes for better query performance
        await queryRunner.createIndex(
            'system_logs',
            new TableIndex({
                name: 'IDX_system_logs_category',
                columnNames: ['category'],
            }),
        );

        await queryRunner.createIndex(
            'system_logs',
            new TableIndex({
                name: 'IDX_system_logs_action',
                columnNames: ['action'],
            }),
        );

        await queryRunner.createIndex(
            'system_logs',
            new TableIndex({
                name: 'IDX_system_logs_user_id',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'system_logs',
            new TableIndex({
                name: 'IDX_system_logs_entity',
                columnNames: ['entity_type', 'entity_id'],
            }),
        );

        await queryRunner.createIndex(
            'system_logs',
            new TableIndex({
                name: 'IDX_system_logs_created_at',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('system_logs');
    }
}
