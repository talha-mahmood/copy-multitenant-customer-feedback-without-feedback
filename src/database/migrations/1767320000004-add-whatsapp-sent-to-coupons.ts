import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWhatsappSentToCoupons1748000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'coupons',
      new TableColumn({
        name: 'whatsapp_sent',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('coupons', 'whatsapp_sent');
  }
}
