import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireLogin } from './auth.js';

const router = Router();

const NAME_MAX_LENGTH = 100;

const USER_COLUMNS = 'id::int AS id, first_name, last_name, email, created_at';

// Same shape the other user-task endpoints return.
const COMPLETED_TASKS_SQL = `
  SELECT ut.id::int AS id,
         ut.task_id::int AS task_id,
         to_char(ut.planned_for, 'YYYY-MM-DD') AS planned_for,
         ut.added_at,
         ut.started_at,
         ut.completed_at,
         ut.points_earned,
         t.title,
         t.description,
         t.difficulty,
         t.category_id::int AS category_id,
         c.name AS category
  FROM user_tasks ut
  JOIN tasks t ON t.id = ut.task_id
  JOIN categories c ON c.id = t.category_id
  WHERE ut.user_id = $1 AND ut.completed_at IS NOT NULL
  ORDER BY ut.completed_at DESC, ut.id DESC`;

const STATS_SQL = `
  SELECT COALESCE(SUM(ut.points_earned) FILTER (WHERE ut.completed_at IS NOT NULL), 0)::int
           AS total_points,
         COUNT(*) FILTER (WHERE ut.completed_at IS NOT NULL)::int AS completed_count,
         COUNT(*) FILTER (WHERE ut.started_at IS NOT NULL AND ut.completed_at IS NULL)::int
           AS in_progress_count,
         COUNT(*) FILTER (WHERE ut.started_at IS NULL AND ut.completed_at IS NULL)::int
           AS planned_count,
         COALESCE(SUM(FLOOR(EXTRACT(EPOCH FROM (ut.completed_at - ut.started_at)) / 60))
           FILTER (WHERE ut.completed_at IS NOT NULL), 0)::int AS total_minutes,
         COUNT(*) FILTER (WHERE ut.completed_at IS NOT NULL AND t.difficulty = 'easy')::int
           AS easy,
         COUNT(*) FILTER (WHERE ut.completed_at IS NOT NULL AND t.difficulty = 'medium')::int
           AS medium,
         COUNT(*) FILTER (WHERE ut.completed_at IS NOT NULL AND t.difficulty = 'hard')::int
           AS hard
  FROM user_tasks ut
  JOIN tasks t ON t.id = ut.task_id
  WHERE ut.user_id = $1`;

const BY_CATEGORY_SQL = `
  SELECT c.name AS category,
         COUNT(*)::int AS completed_count,
         COALESCE(SUM(ut.points_earned), 0)::int AS points
  FROM user_tasks ut
  JOIN tasks t ON t.id = ut.task_id
  JOIN categories c ON c.id = t.category_id
  WHERE ut.user_id = $1 AND ut.completed_at IS NOT NULL
  GROUP BY c.name
  ORDER BY points DESC, completed_count DESC, c.name`;

function toUserTask(row) {
  return {
    id: row.id,
    task_id: row.task_id,
    planned_for: row.planned_for,
    added_at: row.added_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    points_earned: row.points_earned,
    status: 'completed',
    task: {
      id: row.task_id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      category_id: row.category_id,
      category: row.category,
    },
  };
}

// The session can outlive the account; treat that as logged out.
function rejectMissingUser(req, res) {
  req.session.destroy(() => {
    res.status(401).json({ error: 'Please log in' });
  });
}

// GET /api/profile
router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.userId;
  try {
    const userResult = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      userId,
    ]);
    const user = userResult.rows[0];
    if (!user) return rejectMissingUser(req, res);

    const [statsResult, categoryResult, completedResult] = await Promise.all([
      pool.query(STATS_SQL, [userId]),
      pool.query(BY_CATEGORY_SQL, [userId]),
      pool.query(COMPLETED_TASKS_SQL, [userId]),
    ]);
    const s = statsResult.rows[0];

    res.json({
      user,
      total_points: s.total_points,
      stats: {
        completed_count: s.completed_count,
        in_progress_count: s.in_progress_count,
        planned_count: s.planned_count,
        total_minutes: s.total_minutes,
        by_difficulty: { easy: s.easy, medium: s.medium, hard: s.hard },
        by_category: categoryResult.rows,
      },
      completed_tasks: completedResult.rows.map(toUserTask),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const NAME_FIELDS = {
  firstName: 'first_name',
  first_name: 'first_name',
  lastName: 'last_name',
  last_name: 'last_name',
};

const FIELD_LABELS = { first_name: 'First name', last_name: 'Last name' };

// Returns { updates } or { error }.
function parseProfileUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const unknown = Object.keys(body).filter((key) => !Object.hasOwn(NAME_FIELDS, key));
  if (unknown.length > 0) {
    return { error: `Only first name and last name can be updated (got: ${unknown.join(', ')})` };
  }

  const updates = {};
  for (const [key, value] of Object.entries(body)) {
    const column = NAME_FIELDS[key];
    const label = FIELD_LABELS[column];
    if (column in updates) {
      return { error: `${label} was provided more than once` };
    }
    if (typeof value !== 'string') return { error: `${label} must be a string` };
    const trimmed = value.trim();
    if (!trimmed) return { error: `${label} cannot be empty` };
    if (trimmed.length > NAME_MAX_LENGTH) {
      return { error: `${label} must be at most ${NAME_MAX_LENGTH} characters` };
    }
    updates[column] = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Provide firstName and/or lastName to update' };
  }
  return { updates };
}

// PATCH /api/profile
router.patch('/', requireLogin, async (req, res) => {
  const { updates, error } = parseProfileUpdate(req.body);
  if (error) return res.status(400).json({ error });

  // Column names come from the NAME_FIELDS whitelist, never from user input.
  const columns = Object.keys(updates);
  const assignments = columns.map((column, i) => `${column} = $${i + 2}`).join(', ');

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${assignments} WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [req.session.userId, ...columns.map((column) => updates[column])],
    );
    if (!rows[0]) return rejectMissingUser(req, res);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
