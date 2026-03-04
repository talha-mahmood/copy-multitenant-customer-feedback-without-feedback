import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDisapprovalReasonToApprovals1768510000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add disapproval_reason column
        await queryRunner.addColumn(
            'approvals',
            new TableColumn({
                name: 'disapproval_reason',
                type: 'text',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop disapproval_reason column
        await queryRunner.dropColumn('approvals', 'disapproval_reason');
    }
}
