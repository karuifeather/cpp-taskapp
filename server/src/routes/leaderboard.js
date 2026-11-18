import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireLogin } from './auth.js';

const router = Router();

// Points per user from completed tasks. Only first name + last initial are shared.
const STANDINGS = `
  WITH totals AS (
    SELECT u.id,
           u.first_name,
           LEFT(u.last_name, 1) AS last_initial,
           COALESCE(SUM(ut.points_earned) FILTER (WHERE ut.completed_at IS NOT NULL), 0)::int AS total_points,
           COUNT(ut.id) FILTER (WHERE ut.completed_at IS NOT NULL)::int AS completed_count
      FROM users u
      LEFT JOIN user_tasks ut ON ut.user_id = u.id
     GROUP BY u.id
  )
  SELECT RANK() OVER (ORDER BY total_points DESC)::int AS rank,
         id::int AS user_id, first_name, last_initial, total_points, completed_count
    FROM totals`;

// GET /api/leaderboard?limit=10
router.get('/', requireLogin, async (req, res) => {
  let limit = 10;
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ error: 'limit must be a whole number from 1 to 50' });
    }
  }

  const [top, me] = await Promise.all([
    pool.query(
      `SELECT * FROM (${STANDINGS}) s
        WHERE total_points > 0
        ORDER BY rank, completed_count DESC, user_id
        LIMIT $1`,
      [limit],
    ),
    pool.query(`SELECT * FROM (${STANDINGS}) s WHERE user_id = $1`, [req.session.userId]),
  ]);

  res.json({ leaderboard: top.rows, me: me.rows[0] ?? null });
});

export default router;
