import { Router } from 'express';
import { notImplemented } from './notImplemented.js';

const router = Router();

// Area 2 — replace placeholders with auth controllers and secure sessions.
router.post('/signup', notImplemented('Signup'));
router.post('/login', notImplemented('Login'));
router.post('/logout', notImplemented('Logout'));
router.get('/me', notImplemented('Current user lookup'));

export default router;
