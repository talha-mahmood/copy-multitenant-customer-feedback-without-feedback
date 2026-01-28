import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAgentStripeSettingsTable1769100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'agent_stripe_settings',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'admin_id',
                        type: 'int',
                        isUnique: true,
                    },
                    {
                        name: 'publishable_key',
                        type: 'text',
                    },
                    {
                        name: 'secret_key',
                        type: 'text',
                    },
                    {
                        name: 'webhook_secret',
                        type: 'text',
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

        await queryRunner.createForeignKey(
            'agent_stripe_settings',
            new TableForeignKey({
                columnNames: ['admin_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'admins',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('agent_stripe_settings');
    }
}
