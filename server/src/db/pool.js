import pg from 'pg';
import { env } from '../config/env.js';

// Creating the pool is lazy: the API can start even before local Postgres is ready.
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
});

// Make CURRENT_DATE and NOW()::date use the app's timezone on every connection.
pool.on('connect', (client) => {
  client.query('SELECT set_config($1, $2, false)', ['TimeZone', env.timezone]).catch((error) => {
    console.error('Could not set database timezone', error);
  });
});

// An idle connection dropping (e.g. database restart) should not crash the server.
pool.on('error', (error) => {
  console.error('Unexpected database error', error);
});
