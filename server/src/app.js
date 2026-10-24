import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import profileRoutes from './routes/profile.js';
import tasksRoutes from './routes/tasks.js';
import userTaskRoutes from './routes/userTasks.js';

export const app = express();

// Log requests in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });

    next();
  });
}

// Local cross-origin development is handled by the Vite /api proxy. This also
// permits a separately-hosted frontend later, if CLIENT_ORIGIN is configured.
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

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

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});
