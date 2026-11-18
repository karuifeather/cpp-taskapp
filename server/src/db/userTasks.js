import { pool } from './pool.js';

// Shared SELECT for user-task rows joined to their catalog task and category.
// Append WHERE / ORDER BY clauses using the `ut`, `t`, and `c` aliases.
export const USER_TASK_SELECT = `
  SELECT
    ut.id::int AS id,
    ut.task_id::int AS task_id,
    to_char(ut.planned_for, 'YYYY-MM-DD') AS planned_for,
    ut.added_at,
    ut.started_at,
    ut.completed_at,
    ut.points_earned,
    t.title AS task_title,
    t.description AS task_description,
    t.difficulty AS task_difficulty,
    t.category_id::int AS task_category_id,
    c.name AS task_category
  FROM user_tasks ut
  JOIN tasks t ON t.id = ut.task_id
  JOIN categories c ON c.id = t.category_id
`;

export const USER_TASK_STATUSES = ['planned', 'in_progress', 'completed'];

// SQL expression matching the status values produced by userTaskStatus().
export const USER_TASK_STATUS_SQL = `
  CASE
    WHEN ut.completed_at IS NOT NULL THEN 'completed'
    WHEN ut.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'planned'
  END
`;

const toIso = (value) => (value == null ? null : new Date(value).toISOString());

export function userTaskStatus(row) {
  if (row.completed_at) return 'completed';
  if (row.started_at) return 'in_progress';
  return 'planned';
}

// Converts a row produced by USER_TASK_SELECT into the API response shape.
export function serializeUserTask(row) {
  return {
    id: row.id,
    task_id: row.task_id,
    planned_for: row.planned_for,
    added_at: toIso(row.added_at),
    started_at: toIso(row.started_at),
    completed_at: toIso(row.completed_at),
    points_earned: row.points_earned,
    status: userTaskStatus(row),
    task: {
      id: row.task_id,
      title: row.task_title,
      description: row.task_description,
      difficulty: row.task_difficulty,
      category_id: row.task_category_id,
      category: row.task_category,
    },
  };
}

// Returns the serialized user task if it belongs to userId, otherwise null.
export async function findUserTask(userTaskId, userId, db = pool) {
  const { rows } = await db.query(`${USER_TASK_SELECT} WHERE ut.id = $1 AND ut.user_id = $2`, [
    userTaskId,
    userId,
  ]);
  return rows[0] ? serializeUserTask(rows[0]) : null;
}

// Parses a positive integer id from a route param or body value; returns null if invalid.
export function parseId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

// True if value is a real calendar date in YYYY-MM-DD form.
export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Uses the database clock so "today" matches the CURRENT_DATE column default.
export async function isPastDate(dateString, db = pool) {
  const { rows } = await db.query('SELECT $1::date < CURRENT_DATE AS past', [dateString]);
  return rows[0].past;
}
