import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSuperAdminWalletIdToWalletTransactions1768600000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'wallet_transactions',
      new TableColumn({
        name: 'super_admin_wallet_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('wallet_transactions', 'super_admin_wallet_id');
  }
}
