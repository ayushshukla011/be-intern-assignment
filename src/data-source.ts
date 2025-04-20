import { DataSource } from 'typeorm';
import path from 'path';

// Create the AppDataSource instance
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'database.sqlite'),
  entities: [path.join(__dirname, 'entities', '*.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: true, // Set to true for development
  logging: true
});
