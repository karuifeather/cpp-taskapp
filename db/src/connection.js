import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export async function withDatabase(action) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Create a root .env from .env.example.');
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  await client.connect();
  try {
    await action(client);
  } finally {
    await client.end();
  }
}
