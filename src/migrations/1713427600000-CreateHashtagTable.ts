import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateHashtagTable1713427600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "hashtags",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment"
          },
          {
            name: "name",
            type: "varchar",
            isUnique: true
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP"
          }
        ]
      }),
      true
    );

    // Add index for name in Hashtag table (for case-insensitive search)
    await queryRunner.createIndex(
      "hashtags",
      new TableIndex({
        name: "IDX_HASHTAGS_NAME",
        columnNames: ["name"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("hashtags");
  }
} 