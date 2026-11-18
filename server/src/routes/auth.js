import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { SESSION_COOKIE } from '../config/session.js';

const router = Router();

const USER_FIELDS = 'id::int AS id, first_name, last_name, email';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Use on any route that needs a logged-in user; gives you req.session.userId
export function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
}

// New session id on login/signup so an old session id can't be reused.
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const firstName = text(req.body?.firstName);
  const lastName = text(req.body?.lastName);
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return res.status(400).json({ error: 'Names must be 100 characters or less' });
  }
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8 to 72 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING ${USER_FIELDS}`,
      [firstName, lastName, email, hash],
    );
    await startSession(req, rows[0].id);
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = $1`,
      [email],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await startSession(req, user.id);
    const { password_hash: _hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie(SESSION_COOKIE.name, SESSION_COOKIE.clearOptions);
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', requireLogin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [
      req.session.userId,
    ]);
    if (!rows[0]) {
      return req.session.destroy(() => res.status(401).json({ error: 'Please log in' }));
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
