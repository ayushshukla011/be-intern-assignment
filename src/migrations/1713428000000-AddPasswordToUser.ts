import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPasswordToUser1713428000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if password column already exists
    const table = await queryRunner.getTable("users");
    const hasPasswordColumn = table?.findColumnByName("password");
    
    if (!hasPasswordColumn) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "password",
          type: "varchar",
          isNullable: true // Make it nullable to not break existing data
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("users", "password");
  }
} 