import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeApprovalStatusToText1768501000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change column type and convert data
        // We assume 'true' means 'approved' and 'false' means 'pending' (the previous default)
        await queryRunner.query(`
            ALTER TABLE "approvals" 
            ALTER COLUMN "approval_status" TYPE varchar(20) 
            USING (CASE WHEN "approval_status" = true THEN 'approved' ELSE 'pending' END)
        `);

        // Set the new default
        await queryRunner.query(`
            ALTER TABLE "approvals" 
            ALTER COLUMN "approval_status" SET DEFAULT 'pending'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to boolean
        // 'approved' becomes true, everything else (pending, rejected) becomes false
        await queryRunner.query(`
            ALTER TABLE "approvals" 
            ALTER COLUMN "approval_status" TYPE boolean 
            USING (CASE WHEN "approval_status" = 'approved' THEN true ELSE false END)
        `);

        // Set the old default
        await queryRunner.query(`
            ALTER TABLE "approvals" 
            ALTER COLUMN "approval_status" SET DEFAULT false
        `);
    }
}
