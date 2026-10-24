import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();

// Only work with user tasks belonging to the authenticated user.
// Add in authentication middleware when ready. For now, this is a placeholder to claim the endpoints.
router.get('/', notImplemented('Personal task listing'));
router.get('/:userTaskId', notImplemented('Personal task details'));
router.post('/', notImplemented('Selecting a catalog task'));
router.patch('/:userTaskId', notImplemented('Rescheduling a task'));
router.delete('/:userTaskId', notImplemented('Removing a task'));

// Reminder again: The backend will compute points.
router.patch('/:userTaskId/start', notImplemented('Starting a task timer'));
router.patch('/:userTaskId/stop', notImplemented('Stopping a timer and awarding points'));

export default router;
