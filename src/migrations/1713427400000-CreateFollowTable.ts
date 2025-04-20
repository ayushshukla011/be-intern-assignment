import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFollowTable1713427400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "follows",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment"
          },
          {
            name: "followerId",
            type: "integer"
          },
          {
            name: "followedId",
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
            name: "IDX_FOLLOWS_UNIQUE",
            columnNames: ["followerId", "followedId"],
            isUnique: true
          }
        ]
      }),
      true
    );

    await queryRunner.createForeignKey(
      "follows",
      new TableForeignKey({
        columnNames: ["followerId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createForeignKey(
      "follows",
      new TableForeignKey({
        columnNames: ["followedId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createIndex(
      "follows",
      new TableIndex({
        name: "IDX_FOLLOWS_FOLLOWER_CREATED",
        columnNames: ["followerId", "createdAt"]
      })
    );

    await queryRunner.createIndex(
      "follows",
      new TableIndex({
        name: "IDX_FOLLOWS_FOLLOWER_ID",
        columnNames: ["followerId"]
      })
    );

    await queryRunner.createIndex(
      "follows",
      new TableIndex({
        name: "IDX_FOLLOWS_FOLLOWED_ID",
        columnNames: ["followedId"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("follows");
    const followerForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("followerId") !== -1);
    const followedForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("followedId") !== -1);
    
    if (followerForeignKey) {
      await queryRunner.dropForeignKey("follows", followerForeignKey);
    }
    
    if (followedForeignKey) {
      await queryRunner.dropForeignKey("follows", followedForeignKey);
    }
    
    await queryRunner.dropIndex("follows", "IDX_FOLLOWS_FOLLOWER_CREATED");
    await queryRunner.dropIndex("follows", "IDX_FOLLOWS_FOLLOWER_ID");
    await queryRunner.dropIndex("follows", "IDX_FOLLOWS_FOLLOWED_ID");
    await queryRunner.dropIndex("follows", "IDX_FOLLOWS_UNIQUE");
    await queryRunner.dropTable("follows");
  }
} 