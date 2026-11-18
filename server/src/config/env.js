import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Read the shared .env in the repository root
// there is no server-specific .env.
dotenv.config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
});

const mode = process.env.NODE_ENV || 'development';

if (mode === 'production') {
  for (const key of ['DATABASE_URL', 'SESSION_SECRET']) {
    if (!process.env[key]) throw new Error(`${key} must be set in production`);
  }
}

const timezone = process.env.APP_TIMEZONE || 'America/Chicago';
try {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone });
} catch {
  throw new Error(`APP_TIMEZONE "${timezone}" is not a valid timezone`);
}

export const env = {
  appName: process.env.APP_NAME || 'cpp-taskapp',
  mode,
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
  // "Today" for planned dates is based on this timezone, not the server's.
  timezone,
};
