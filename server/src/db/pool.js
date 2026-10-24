import pg from 'pg';
import { env } from '../config/env.js';

// Creating the pool is lazy: the API can start even before local Postgres is ready.
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: true } : undefined,
});
