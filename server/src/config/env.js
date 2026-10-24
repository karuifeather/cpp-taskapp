import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Read the shared .env in the repository root
// there is no server-specific .env.
dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

export const env = {
  appName: process.env.APP_NAME || 'cpp-taskapp',
  mode: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
};
