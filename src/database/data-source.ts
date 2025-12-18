import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

dotenv.config();
const dbConfig = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5433),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['dist/**/*.entity{.js,.ts}'],
  migrations: ['dist/database/migrations/*{.js,.ts}'],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
});

initializeTransactionalContext({
  storageDriver: StorageDriver.ASYNC_LOCAL_STORAGE,
});
addTransactionalDataSource(dbConfig);

export default dbConfig;
