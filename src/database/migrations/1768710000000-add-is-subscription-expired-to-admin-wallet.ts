import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsSubscriptionExpiredToAdminWallet1768710000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admin_wallets',
      new TableColumn({
        name: 'is_subscription_expired',
        type: 'boolean',
        default: true,
        comment: 'Indicates if the admin subscription has expired',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('admin_wallets', 'is_subscription_expired');
  }
}
