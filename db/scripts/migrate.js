import { readFile } from 'node:fs/promises';
import { withDatabase } from '../src/connection.js';

export async function migrate(client) {
  const sql = await readFile(new URL('../sql/001_init.sql', import.meta.url), 'utf8');
  await client.query(sql);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  withDatabase(migrate)
    .then(() => console.log('Database schema is ready.'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
