import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateLikeTable1713427500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "likes",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment"
          },
          {
            name: "userId",
            type: "integer"
          },
          {
            name: "postId",
            type: "integer"
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP"
          }
        ],
        indices: [
          {
            name: "IDX_LIKES_UNIQUE",
            columnNames: ["userId", "postId"],
            isUnique: true
          }
        ]
      }),
      true
    );

    await queryRunner.createForeignKey(
      "likes",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createForeignKey(
      "likes",
      new TableForeignKey({
        columnNames: ["postId"],
        referencedColumnNames: ["id"],
        referencedTableName: "posts",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createIndex(
      "likes",
      new TableIndex({
        name: "IDX_LIKES_USER_ID",
        columnNames: ["userId"]
      })
    );

    await queryRunner.createIndex(
      "likes",
      new TableIndex({
        name: "IDX_LIKES_POST_ID",
        columnNames: ["postId"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("likes");
    const userForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
    const postForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("postId") !== -1);
    
    if (userForeignKey) {
      await queryRunner.dropForeignKey("likes", userForeignKey);
    }
    
    if (postForeignKey) {
      await queryRunner.dropForeignKey("likes", postForeignKey);
    }
    
    await queryRunner.dropIndex("likes", "IDX_LIKES_UNIQUE");
    await queryRunner.dropTable("likes");
  }
} 