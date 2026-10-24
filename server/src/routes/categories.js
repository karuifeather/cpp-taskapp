import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();
router.get('/', notImplemented('Category listing'));
export default router;
