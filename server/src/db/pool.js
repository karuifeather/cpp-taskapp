import pg from 'pg';
import { env } from '../config/env.js';

// Creating the pool is lazy: the API can start even before local Postgres is ready.
// TimeZone makes CURRENT_DATE match the app's "today" instead of the server's.
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
  options: `-c TimeZone=${env.timezone}`,
});

// An idle connection dropping (e.g. database restart) should not crash the server.
pool.on('error', (error) => {
  console.error('Unexpected database error', error);
});
