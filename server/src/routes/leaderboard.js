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

// GET /api/leaderboard?limit=10&offset=0
router.get('/', requireLogin, async (req, res) => {
  let limit = 10;
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ error: 'limit must be a whole number from 1 to 50' });
    }
  }

  // offset skips that many players, used for paging
  let offset = 0;
  if (req.query.offset !== undefined) {
    offset = Number(req.query.offset);
    if (!Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ error: 'offset must be a whole number of 0 or more' });
    }
  }

  const [top, me, count] = await Promise.all([
    pool.query(
      `SELECT * FROM (${STANDINGS}) s
        WHERE total_points > 0
        ORDER BY rank, completed_count DESC, user_id
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    pool.query(`SELECT * FROM (${STANDINGS}) s WHERE user_id = $1`, [req.session.userId]),
    // total players on the board, so the page knows how many pages there are
    pool.query(`SELECT COUNT(*)::int AS total FROM (${STANDINGS}) s WHERE total_points > 0`),
  ]);

  res.json({ leaderboard: top.rows, me: me.rows[0] ?? null, total: count.rows[0].total });
});

export default router;
