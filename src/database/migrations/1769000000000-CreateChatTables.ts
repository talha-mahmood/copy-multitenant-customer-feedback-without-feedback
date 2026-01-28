import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateChatTables1769000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Conversations Table
        await queryRunner.createTable(new Table({
            name: "conversations",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "type",
                    type: "varchar",
                },
                {
                    name: "super_admin_id",
                    type: "int",
                    isNullable: true,
                },
                {
                    name: "agent_id",
                    type: "int",
                },
                {
                    name: "merchant_id",
                    type: "int",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "deleted_at",
                    type: "timestamp",
                    isNullable: true
                }
            ]
        }), true);

        // Add Foreign Keys for Conversations
        await queryRunner.createForeignKeys("conversations", [
            new TableForeignKey({
                columnNames: ["super_admin_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "super_admins",
                onDelete: "SET NULL"
            }),
            new TableForeignKey({
                columnNames: ["agent_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "admins",
                onDelete: "CASCADE"
            }),
            new TableForeignKey({
                columnNames: ["merchant_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "merchants",
                onDelete: "SET NULL"
            })
        ]);

        // Create Messages Table
        await queryRunner.createTable(new Table({
            name: "messages",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "conversation_id",
                    type: "int",
                },
                {
                    name: "sender_id",
                    type: "int",
                },
                {
                    name: "sender_role",
                    type: "varchar",
                },
                {
                    name: "content",
                    type: "text",
                },
                {
                    name: "is_read",
                    type: "boolean",
                    default: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "deleted_at",
                    type: "timestamp",
                    isNullable: true
                }
            ]
        }), true);

        // Add Foreign Key for Messages
        await queryRunner.createForeignKey("messages", new TableForeignKey({
            columnNames: ["conversation_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "conversations",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("messages");
        await queryRunner.dropTable("conversations");
    }

}
