import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET /api/categories -> { categories: [{ id, name, task_count }] }
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id::int AS id, c.name, COUNT(t.id)::int AS task_count
       FROM categories AS c
       LEFT JOIN tasks AS t ON t.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY c.name`,
    );
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
