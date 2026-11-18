import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { sessionMiddleware } from './config/session.js';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import profileRoutes from './routes/profile.js';
import tasksRoutes from './routes/tasks.js';
import userTaskRoutes from './routes/userTasks.js';

export const app = express();

// Render (and most hosts) sit behind a proxy; needed for secure cookies.
if (env.mode === 'production') app.set('trust proxy', 1);

// Log requests outside production mode.
if (env.mode !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });

    next();
  });
}

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', sessionMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', appName: env.appName });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/user-tasks', userTaskRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

// In production the API also serves the built React app from client/dist.
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (env.mode === 'production' && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (_req, res) => res.sendFile('index.html', { root: clientDist }));
}

app.use((error, _req, res, _next) => {
  // Malformed JSON or a body that is too large.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});
