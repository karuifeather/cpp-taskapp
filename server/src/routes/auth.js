import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

const router = Router();

// Use on any route that needs a logged-in user; gives you req.session.userId
export function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email.toLowerCase(), hash],
    );
    req.session.userId = rows[0].id;
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/login
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
      (email || '').toLowerCase(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/auth/me
router.get('/me', requireLogin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [req.session.userId],
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
