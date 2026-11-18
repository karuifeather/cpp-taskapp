import { Router } from 'express';
import { pool } from '../db/pool.js';
import {
  USER_TASK_SELECT,
  USER_TASK_STATUSES,
  USER_TASK_STATUS_SQL,
  findUserTask,
  isPastDate,
  isValidDateString,
  parseId,
  serializeUserTask,
} from '../db/userTasks.js';
import { requireLogin } from './auth.js';
import { startTimer, stopTimer } from '../controllers/timers.js';

const router = Router();

// Only work with user tasks belonging to the authenticated user.
// GET /api/user-tasks?date=YYYY-MM-DD&status=planned|in_progress|completed
router.get('/', requireLogin, async (req, res) => {
  const { date, status } = req.query;
  const params = [req.session.userId];
  const conditions = ['ut.user_id = $1'];

  if (date !== undefined) {
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: 'date must be a valid date in YYYY-MM-DD format' });
    }
    params.push(date);
    conditions.push(`ut.planned_for = $${params.length}::date`);
  }

  if (status !== undefined) {
    if (!USER_TASK_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${USER_TASK_STATUSES.join(', ')}` });
    }
    params.push(status);
    conditions.push(`${USER_TASK_STATUS_SQL} = $${params.length}`);
  }

  const { rows } = await pool.query(
    `${USER_TASK_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY ut.planned_for, ut.added_at, ut.id`,
    params,
  );
  res.json({ user_tasks: rows.map(serializeUserTask) });
});

// GET /api/user-tasks/:userTaskId
router.get('/:userTaskId', requireLogin, async (req, res) => {
  const userTaskId = parseId(req.params.userTaskId);
  if (!userTaskId) return res.status(400).json({ error: 'Invalid user task id' });

  const userTask = await findUserTask(userTaskId, req.session.userId);
  if (!userTask) return res.status(404).json({ error: 'User task not found' });
  res.json({ user_task: userTask });
});

const isDuplicateDay = (error) =>
  error.code === '23505' && error.constraint === 'idx_user_tasks_one_per_day';

// POST /api/user-tasks  body: { taskId, plannedFor? }
router.post('/', requireLogin, async (req, res) => {
  const body = req.body || {};
  const rawTaskId = body.taskId ?? body.task_id;
  const plannedFor = body.plannedFor ?? body.planned_for;

  const taskId = parseId(rawTaskId);
  if (!taskId) return res.status(400).json({ error: 'taskId must be a positive integer' });

  if (plannedFor !== undefined && plannedFor !== null) {
    if (!isValidDateString(plannedFor)) {
      return res
        .status(400)
        .json({ error: 'plannedFor must be a valid date in YYYY-MM-DD format' });
    }
    if (await isPastDate(plannedFor)) {
      return res.status(400).json({ error: 'plannedFor cannot be in the past' });
    }
  }

  // Inserts nothing when the catalog task does not exist.
  let rows;
  try {
    ({ rows } = await pool.query(
      `INSERT INTO user_tasks (user_id, task_id, planned_for)
       SELECT $1, t.id, COALESCE($3::date, CURRENT_DATE) FROM tasks t WHERE t.id = $2
       RETURNING id::int AS id`,
      [req.session.userId, taskId, plannedFor ?? null],
    ));
  } catch (error) {
    if (isDuplicateDay(error)) {
      return res.status(409).json({ error: 'Task is already planned for that day' });
    }
    throw error;
  }
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });

  const userTask = await findUserTask(rows[0].id, req.session.userId);
  res.status(201).json({ user_task: userTask });
});

// PATCH /api/user-tasks/:userTaskId  body: { plannedFor }
router.patch('/:userTaskId', requireLogin, async (req, res) => {
  const userTaskId = parseId(req.params.userTaskId);
  if (!userTaskId) return res.status(400).json({ error: 'Invalid user task id' });

  const body = req.body || {};
  const plannedFor = body.plannedFor ?? body.planned_for;
  if (plannedFor === undefined || plannedFor === null) {
    return res.status(400).json({ error: 'plannedFor is required' });
  }
  if (!isValidDateString(plannedFor)) {
    return res.status(400).json({ error: 'plannedFor must be a valid date in YYYY-MM-DD format' });
  }
  if (await isPastDate(plannedFor)) {
    return res.status(400).json({ error: 'plannedFor cannot be in the past' });
  }

  let rowCount;
  try {
    ({ rowCount } = await pool.query(
      `UPDATE user_tasks SET planned_for = $3::date
       WHERE id = $1 AND user_id = $2 AND started_at IS NULL`,
      [userTaskId, req.session.userId, plannedFor],
    ));
  } catch (error) {
    if (isDuplicateDay(error)) {
      return res.status(409).json({ error: 'Task is already planned for that day' });
    }
    throw error;
  }

  const userTask = await findUserTask(userTaskId, req.session.userId);
  if (!userTask) return res.status(404).json({ error: 'User task not found' });
  if (rowCount === 0) {
    return res.status(409).json({ error: 'Cannot reschedule a task that has already started' });
  }
  res.json({ user_task: userTask });
});

// DELETE /api/user-tasks/:userTaskId
router.delete('/:userTaskId', requireLogin, async (req, res) => {
  const userTaskId = parseId(req.params.userTaskId);
  if (!userTaskId) return res.status(400).json({ error: 'Invalid user task id' });

  const { rowCount } = await pool.query(
    'DELETE FROM user_tasks WHERE id = $1 AND user_id = $2 AND started_at IS NULL',
    [userTaskId, req.session.userId],
  );
  if (rowCount > 0) return res.json({ deleted: true, id: userTaskId });

  const existing = await findUserTask(userTaskId, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'User task not found' });
  res.status(409).json({ error: 'Cannot remove a task that has already started' });
});

// Reminder again: The backend will compute points.
router.patch('/:userTaskId/start', requireLogin, startTimer);
router.patch('/:userTaskId/stop', requireLogin, stopTimer);

export default router;
