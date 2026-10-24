import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();

// Authenticated users can retrieve and update their own profile information.
// No other users can access this endpoint.
// Add in authentication middleware when ready.
// For now, this is a placeholder to claim the endpoints.
router.get('/', notImplemented('Profile retrieval'));
router.patch('/', notImplemented('Profile updates'));

export default router;
