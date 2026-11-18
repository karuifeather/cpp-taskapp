import { pool } from '../db/pool.js';

// Timer endpoints for user tasks (issue #25).
// Every timestamp comes from PostgreSQL NOW(); the request body is ignored entirely.

const MAX_POINTS = 120;
const ACTIVE_TIMER_INDEX = 'idx_user_tasks_one_active_timer';

// Shape a user_tasks row (aliased "ut") joined with its catalog task into the shared response shape.
// NOW() is stable within a statement, so server_time and elapsed_seconds agree with each other.
const USER_TASK_COLUMNS = `
  ut.id::int AS id,
  ut.task_id::int AS task_id,
  to_char(ut.planned_for, 'YYYY-MM-DD') AS planned_for,
  ut.added_at,
  ut.started_at,
  ut.completed_at,
  ut.points_earned,
  CASE
    WHEN ut.completed_at IS NOT NULL THEN 'completed'
    WHEN ut.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'planned'
  END AS status,
  CASE
    WHEN ut.started_at IS NULL THEN NULL
    ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(ut.completed_at, NOW()) - ut.started_at))))::int
  END AS elapsed_seconds,
  NOW() AS server_time,
  t.id::int AS t_id,
  t.title AS t_title,
  t.description AS t_description,
  t.difficulty AS t_difficulty,
  t.category_id::int AS t_category_id,
  c.name AS t_category
`;

const USER_TASK_JOINS = `
  JOIN tasks t ON t.id = ut.task_id
  JOIN categories c ON c.id = t.category_id
`;

function toResponse(row, extra = {}) {
  return {
    user_task: {
      id: row.id,
      task_id: row.task_id,
      planned_for: row.planned_for,
      added_at: toIso(row.added_at),
      started_at: toIso(row.started_at),
      completed_at: toIso(row.completed_at),
      points_earned: row.points_earned,
      status: row.status,
      task: {
        id: row.t_id,
        title: row.t_title,
        description: row.t_description,
        difficulty: row.t_difficulty,
        category_id: row.t_category_id,
        category: row.t_category,
      },
    },
    timer: {
      started_at: toIso(row.started_at),
      completed_at: toIso(row.completed_at),
      elapsed_seconds: row.elapsed_seconds,
      server_time: toIso(row.server_time),
    },
    ...extra,
  };
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function parseUserTaskId(raw) {
  if (!/^[1-9]\d*$/.test(String(raw))) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

async function findOwnedUserTask(userTaskId, userId) {
  const { rows } = await pool.query(
    `SELECT ${USER_TASK_COLUMNS},
            (ut.planned_for > CURRENT_DATE) AS planned_in_future
       FROM user_tasks ut ${USER_TASK_JOINS}
      WHERE ut.id = $1 AND ut.user_id = $2`,
    [userTaskId, userId],
  );
  return rows[0] || null;
}

async function findActiveUserTaskId(userId) {
  const { rows } = await pool.query(
    `SELECT id::int AS id FROM user_tasks
      WHERE user_id = $1 AND started_at IS NOT NULL AND completed_at IS NULL
      LIMIT 1`,
    [userId],
  );
  return rows[0]?.id ?? null;
}

async function activeTimerConflict(res, userId) {
  const activeId = await findActiveUserTaskId(userId);
  return res.status(409).json({
    error: 'You already have an active timer. Stop it before starting another task.',
    active_user_task_id: activeId,
  });
}

// PATCH /api/user-tasks/:userTaskId/start
export async function startTimer(req, res) {
  const userTaskId = parseUserTaskId(req.params.userTaskId);
  if (!userTaskId)
    return res.status(400).json({ error: 'User task id must be a positive integer' });
  const userId = req.session.userId;

  try {
    let rows;
    try {
      // The partial unique index is the race-proof guard for "one active timer per user".
      ({ rows } = await pool.query(
        `WITH ut AS (
           UPDATE user_tasks
              SET started_at = NOW()
            WHERE id = $1 AND user_id = $2
              AND started_at IS NULL AND completed_at IS NULL
              AND planned_for <= CURRENT_DATE
           RETURNING *
         )
         SELECT ${USER_TASK_COLUMNS} FROM ut ${USER_TASK_JOINS}`,
        [userTaskId, userId],
      ));
    } catch (err) {
      if (err.code === '23505' && err.constraint === ACTIVE_TIMER_INDEX) {
        return activeTimerConflict(res, userId);
      }
      throw err;
    }

    if (rows[0]) return res.status(200).json(toResponse(rows[0]));

    // Nothing was updated: work out why.
    const existing = await findOwnedUserTask(userTaskId, userId);
    if (!existing) return res.status(404).json({ error: 'User task not found' });
    if (existing.completed_at) {
      return res.status(409).json({ error: 'This task has already been completed' });
    }
    if (existing.started_at) {
      return res.status(409).json({ error: 'This task timer has already been started' });
    }
    if (existing.planned_in_future) {
      return res
        .status(409)
        .json({ error: 'This task is planned for a future date and cannot be started yet' });
    }
    // State changed between the UPDATE and the lookup; let the client retry.
    return res.status(409).json({ error: 'This task cannot be started right now' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

// PATCH /api/user-tasks/:userTaskId/stop
export async function stopTimer(req, res) {
  const userTaskId = parseUserTaskId(req.params.userTaskId);
  if (!userTaskId)
    return res.status(400).json({ error: 'User task id must be a positive integer' });
  const userId = req.session.userId;

  try {
    // 1 point per full elapsed minute, capped at MAX_POINTS, computed and saved in one statement.
    const { rows } = await pool.query(
      `WITH ut AS (
         UPDATE user_tasks
            SET completed_at = NOW(),
                points_earned = LEAST($3, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60)))::int
          WHERE id = $1 AND user_id = $2
            AND started_at IS NOT NULL AND completed_at IS NULL
         RETURNING *
       )
       SELECT ${USER_TASK_COLUMNS} FROM ut ${USER_TASK_JOINS}`,
      [userTaskId, userId, MAX_POINTS],
    );

    if (rows[0]) {
      return res.status(200).json(toResponse(rows[0], { points_awarded: rows[0].points_earned }));
    }

    const existing = await findOwnedUserTask(userTaskId, userId);
    if (!existing) return res.status(404).json({ error: 'User task not found' });
    if (existing.completed_at) {
      return res.status(409).json({ error: 'This task has already been completed' });
    }
    if (!existing.started_at) {
      return res.status(409).json({ error: 'This task timer has not been started' });
    }
    return res.status(409).json({ error: 'This task cannot be stopped right now' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
