import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddHomepagePushFieldsToApprovals1770700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get existing table structure
        const table = await queryRunner.getTable('approvals');
        if (!table) {
            throw new Error('Approvals table not found');
        }
        const columnNames = table.columns.map(col => col.name);

        // Add coupon_id column
        if (!columnNames.includes('coupon_id')) {
            await queryRunner.addColumn('approvals', new TableColumn({
                name: 'coupon_id',
                type: 'integer',
                isNullable: true,
            }));

            // Add foreign key for coupon_id
            await queryRunner.createForeignKey('approvals', new TableForeignKey({
                columnNames: ['coupon_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'coupons',
                onDelete: 'CASCADE',
            }));
        }

        // Add forwarded_by_agent column
        if (!columnNames.includes('forwarded_by_agent')) {
            await queryRunner.addColumn('approvals', new TableColumn({
                name: 'forwarded_by_agent',
                type: 'boolean',
                default: false,
            }));
        }

        // Add payment_status column
        if (!columnNames.includes('payment_status')) {
            await queryRunner.addColumn('approvals', new TableColumn({
                name: 'payment_status',
                type: 'varchar',
                length: '50',
                default: "'pending'",
            }));
        }

        // Add payment_amount column
        if (!columnNames.includes('payment_amount')) {
            await queryRunner.addColumn('approvals', new TableColumn({
                name: 'payment_amount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }));
        }

        // Add payment_intent_id column
        if (!columnNames.includes('payment_intent_id')) {
            await queryRunner.addColumn('approvals', new TableColumn({
                name: 'payment_intent_id',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }));
        }

        // Skip disapproval_reason - already exists from previous migration
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key first
        const table = await queryRunner.getTable('approvals');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('coupon_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('approvals', foreignKey);
            }
        }

        // Drop columns
        await queryRunner.dropColumn('approvals', 'disapproval_reason');
        await queryRunner.dropColumn('approvals', 'payment_intent_id');
        await queryRunner.dropColumn('approvals', 'payment_amount');
        await queryRunner.dropColumn('approvals', 'payment_status');
        await queryRunner.dropColumn('approvals', 'forwarded_by_agent');
        await queryRunner.dropColumn('approvals', 'coupon_id');
    }
}
