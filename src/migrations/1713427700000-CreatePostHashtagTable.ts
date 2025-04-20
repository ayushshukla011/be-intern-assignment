import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePostHashtagTable1713427700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "post_hashtags",
        columns: [
          {
            name: "postId",
            type: "integer",
            isPrimary: true
          },
          {
            name: "hashtagId",
            type: "integer",
            isPrimary: true
          }
        ]
      }),
      true
    );

    await queryRunner.createForeignKey(
      "post_hashtags",
      new TableForeignKey({
        columnNames: ["postId"],
        referencedColumnNames: ["id"],
        referencedTableName: "posts",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createForeignKey(
      "post_hashtags",
      new TableForeignKey({
        columnNames: ["hashtagId"],
        referencedColumnNames: ["id"],
        referencedTableName: "hashtags",
        onDelete: "CASCADE"
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("post_hashtags");
    const postForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("postId") !== -1);
    const hashtagForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("hashtagId") !== -1);
    
    if (postForeignKey) {
      await queryRunner.dropForeignKey("post_hashtags", postForeignKey);
    }
    
    if (hashtagForeignKey) {
      await queryRunner.dropForeignKey("post_hashtags", hashtagForeignKey);
    }
    
    await queryRunner.dropTable("post_hashtags");
  }
} 