-- Primary keys and category lookup: one category has many catalog tasks.
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  UNIQUE (category_id, title)
);

-- Many-to-many join table: users select catalog tasks as independent instances.
CREATE TABLE IF NOT EXISTS user_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id),
  planned_for DATE NOT NULL DEFAULT CURRENT_DATE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned BETWEEN 0 AND 120),
  CONSTRAINT completion_needs_start CHECK (completed_at IS NULL OR started_at IS NOT NULL),
  CONSTRAINT completed_after_start CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_date ON user_tasks (user_id, planned_for);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks (task_id);

-- PostgreSQL also enforces no more than one active task per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tasks_one_active_timer
  ON user_tasks (user_id)
  WHERE started_at IS NOT NULL AND completed_at IS NULL;
