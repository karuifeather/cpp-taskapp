import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { pool } from '../db/pool.js';
import { env } from './env.js';

const isProduction = env.mode === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export const SESSION_COOKIE = {
  name: 'sid',
  clearOptions: cookieOptions,
};

const PgStore = connectPgSimple(session);

// Sessions live in the "session" table so logins survive restarts and deploys.
export const sessionMiddleware = session({
  name: SESSION_COOKIE.name,
  store: new PgStore({ pool, tableName: 'session' }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 },
});
