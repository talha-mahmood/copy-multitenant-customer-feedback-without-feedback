import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RefactorApprovalsTable1768500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop paid_ad_placement column
        await queryRunner.dropColumn('approvals', 'paid_ad_placement');

        // Drop paid_ad_image column
        await queryRunner.dropColumn('approvals', 'paid_ad_image');

        // Add approval_type column
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'approval_type',
                type: 'varchar',
                length: '100',
                isNullable: false,
            }),
        );

        // Add approval_owner column
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'approval_owner',
                type: 'varchar',
                length: '50',
                default: "'agent'",
            }),
        );

        // Add agent_id column
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'agent_id',
                type: 'int',
                isNullable: true,
            }),
        );

        // Add request_from column
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'request_from',
                type: 'varchar',
                length: '50',
                default: "'merchant'",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove new columns
        await queryRunner.dropColumn('approvals', 'request_from');
        await queryRunner.dropColumn('approvals', 'agent_id');
        await queryRunner.dropColumn('approvals', 'approval_owner');
        await queryRunner.dropColumn('approvals', 'approval_type');

        // Re-add old columns
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'paid_ad_image',
                type: 'text',
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'paid_ad_placement',
                type: 'text',
                isNullable: true,
            }),
        );
    }
}
