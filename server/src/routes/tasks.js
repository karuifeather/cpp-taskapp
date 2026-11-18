import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const POSITIVE_INT = /^[1-9]\d*$/;
// Largest BIGINT; anything above it cannot be a valid id.
const MAX_BIGINT = 9223372036854775807n;

const isValidId = (value) =>
  typeof value === 'string' && POSITIVE_INT.test(value) && BigInt(value) <= MAX_BIGINT;

// Shared SELECT for catalog task objects: { id, title, description, difficulty, category_id, category }
const TASK_SELECT = `
  SELECT t.id::int AS id, t.title, t.description, t.difficulty,
         t.category_id::int AS category_id, c.name AS category
  FROM tasks AS t
  JOIN categories AS c ON c.id = t.category_id`;

// Resolve a category id, name, or slug ("exam-review" <-> "Exam Review") to its id.
async function findCategoryId(value) {
  const { rows } = isValidId(value)
    ? await pool.query('SELECT id::int AS id FROM categories WHERE id = $1', [value])
    : await pool.query(
        `SELECT id::int AS id FROM categories
         WHERE LOWER(name) = LOWER($1)
            OR LOWER(REGEXP_REPLACE(TRIM(name), '\\s+', '-', 'g')) = LOWER($1)
         LIMIT 1`,
        [value.trim()],
      );
  return rows[0]?.id ?? null;
}

// GET /api/tasks?category=<id|name|slug>&difficulty=easy|medium|hard -> { tasks: [...] }
router.get('/', async (req, res, next) => {
  const { category, difficulty } = req.query;

  if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (difficulty !== undefined && !DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Difficulty must be one of: easy, medium, hard' });
  }

  try {
    const conditions = [];
    const params = [];

    if (category !== undefined) {
      const categoryId = await findCategoryId(category);
      if (categoryId === null) return res.status(404).json({ error: 'Category not found' });
      params.push(categoryId);
      conditions.push(`t.category_id = $${params.length}`);
    }
    if (difficulty !== undefined) {
      params.push(difficulty);
      conditions.push(`t.difficulty = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `${TASK_SELECT}
       ${where}
       ORDER BY c.name,
                CASE t.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                t.title`,
      params,
    );
    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:taskId -> { task: {...} }
router.get('/:taskId', async (req, res, next) => {
  const { taskId } = req.params;
  if (!isValidId(taskId)) {
    return res.status(400).json({ error: 'Task id must be a positive integer' });
  }

  try {
    const { rows } = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
