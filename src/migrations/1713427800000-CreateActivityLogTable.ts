import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateActivityLogTable1713427800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "activity_logs",
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
            name: "activityType",
            type: "varchar"
          },
          {
            name: "entityId",
            type: "integer"
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

    await queryRunner.createForeignKey(
      "activity_logs",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE"
      })
    );

    await queryRunner.createIndex(
      "activity_logs",
      new TableIndex({
        name: "IDX_ACTIVITY_USER_TYPE_DATE",
        columnNames: ["userId", "activityType", "createdAt"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("activity_logs");
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
    
    if (foreignKey) {
      await queryRunner.dropForeignKey("activity_logs", foreignKey);
    }
    
    await queryRunner.dropIndex("activity_logs", "IDX_ACTIVITY_USER_TYPE_DATE");
    await queryRunner.dropTable("activity_logs");
  }
} 