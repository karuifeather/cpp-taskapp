import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { withDatabase } from '../src/connection.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction || process.env.ALLOW_DB_RESET !== 'true') {
  throw new Error(
    isProduction
      ? 'Database reset is disabled in production.'
      : 'Set ALLOW_DB_RESET=true in your local .env to allow a destructive reset.',
  );
}

// A deliberate opt-in is required because reset deletes ALL users and their data.
await withDatabase(async (client) => {
  await client.query('BEGIN');
  try {
    await client.query('DROP TABLE IF EXISTS user_tasks, tasks, categories, users CASCADE');
    await migrate(client);
    await seed(client);
    await client.query('COMMIT');
    console.log('Local database reset and seeded. All prior records were deleted.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
