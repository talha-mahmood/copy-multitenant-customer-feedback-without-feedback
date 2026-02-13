import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeSecretKeyToAdmins1770500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admins',
      new TableColumn({
        name: 'stripe_secret_key',
        type: 'text',
        isNullable: true,
        comment: 'Agent Stripe secret key for payment processing',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('admins', 'stripe_secret_key');
  }
}
