import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();
router.get('/', notImplemented('Task listing and filtering'));
router.get('/:taskId', notImplemented('Task details'));

export default router;
