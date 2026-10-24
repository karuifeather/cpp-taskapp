import { withDatabase } from '../src/connection.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Database reset is disabled in production.');
}

// A deliberate opt-in is required because reset deletes ALL users and their data.
// Load the root .env before checking its value in the connection helper below.
await withDatabase(async (client) => {
  if (process.env.ALLOW_DB_RESET !== 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('Set ALLOW_DB_RESET=true in your local .env to allow a destructive reset.');
  }

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
