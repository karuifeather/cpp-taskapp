import { readFile } from 'node:fs/promises';
import { withDatabase } from '../src/connection.js';

export async function seed(client) {
  const sql = await readFile(new URL('../sql/002_seed.sql', import.meta.url), 'utf8');
  await client.query(sql);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  withDatabase(seed)
    .then(() => console.log('Categories and tasks are seeded.'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
