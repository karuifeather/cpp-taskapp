INSERT INTO categories (name) VALUES
  ('Homework'), ('Exam Review'), ('Chores'), ('Health'), ('Personal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tasks (category_id, title, difficulty)
SELECT c.id, s.title, s.difficulty
FROM (VALUES
  ('Homework', 'Read for 20 minutes', 'medium'),
  ('Homework', 'Finish two assignments', 'hard'),
  ('Homework', 'Finish one assignment', 'medium'),
  ('Homework', 'Do 10 math problems', 'medium'),
  ('Homework', 'Write one page of an essay', 'hard'),
  ('Homework', 'Check what homework is due this week', 'easy'),
  ('Exam Review', 'Make flashcards for one topic', 'medium'),
  ('Exam Review', 'Review class notes for 30 minutes', 'medium'),
  ('Exam Review', 'Do one practice test', 'hard'),
  ('Exam Review', 'Study with a friend', 'medium'),
  ('Exam Review', 'Make a study plan for the next exam', 'easy'),
  ('Chores', 'Do your laundry', 'medium'),
  ('Chores', 'Fold your clothes', 'easy'),
  ('Chores', 'Clean your room', 'medium'),
  ('Chores', 'Make your bed', 'easy'),
  ('Chores', 'Wash the dishes', 'easy'),
  ('Chores', 'Cook dinner', 'hard'),
  ('Health', 'Drink two glasses of water', 'easy'),
  ('Health', 'Go for a 20 minute walk', 'medium'),
  ('Health', 'Do a 30 minute workout', 'hard'),
  ('Health', 'Stretch for 10 minutes', 'easy'),
  ('Health', 'Eat a fruit or vegetable', 'easy'),
  ('Health', 'Go to bed before 11 pm', 'medium'),
  ('Personal', 'Read a book for fun', 'easy'),
  ('Personal', 'Practice a hobby or instrument', 'medium'),
  ('Personal', 'Write in a journal', 'easy'),
  ('Personal', 'Call or text a family member', 'easy'),
  ('Personal', 'Plan tomorrow', 'easy'),
  ('Personal', 'Have screen free time for 1 hour', 'hard')
) AS s(category, title, difficulty)
JOIN categories AS c ON c.name = s.category
ON CONFLICT (category_id, title) DO NOTHING;

-- Demo users so the leaderboard has people on it.
-- Every demo user's password is: questmaster123
-- Users that already exist (same email) are skipped.
INSERT INTO users (first_name, last_name, email, password_hash)
SELECT s.first_name, s.last_name, s.email,
       '$2b$10$XKOW/klXieQUjtOsxnSSMuwMMd35WgSK32QHR.6lhy.3H7UOdAwEK'
FROM (VALUES
  ('Maria', 'Hernandez', 'maria@questmaster.test'),
  ('Chris', 'Bennett', 'chris@questmaster.test'),
  ('Tama', 'Kealoha', 'tama@questmaster.test'),
  ('Priya', 'Shah', 'priya@questmaster.test'),
  ('Jordan', 'Lee', 'jordan@questmaster.test'),
  ('Blair', 'Nguyen', 'blair@questmaster.test'),
  ('Sofia', 'Rossi', 'sofia@questmaster.test'),
  ('Alex', 'Rivera', 'alex@questmaster.test'),
  ('Omar', 'Haddad', 'omar@questmaster.test'),
  ('Grace', 'Kim', 'grace@questmaster.test'),
  ('Diego', 'Morales', 'diego@questmaster.test'),
  ('Hana', 'Sato', 'hana@questmaster.test'),
  ('Liam', 'Walsh', 'liam@questmaster.test'),
  ('Zoe', 'Carter', 'zoe@questmaster.test'),
  ('Ravi', 'Kumar', 'ravi@questmaster.test'),
  ('Nina', 'Okafor', 'nina@questmaster.test'),
  ('Ethan', 'Brooks', 'ethan@questmaster.test'),
  ('Aisha', 'Bello', 'aisha@questmaster.test'),
  ('Lucas', 'Silva', 'lucas@questmaster.test'),
  ('Mei', 'Chen', 'mei@questmaster.test'),
  ('Noah', 'Fischer', 'noah@questmaster.test'),
  ('Amara', 'Diallo', 'amara@questmaster.test'),
  ('Ben', 'Cohen', 'ben@questmaster.test'),
  ('Yuki', 'Tanaka', 'yuki@questmaster.test'),
  ('Mateo', 'Garcia', 'mateo@questmaster.test'),
  ('Leila', 'Karimi', 'leila@questmaster.test'),
  ('Owen', 'Murphy', 'owen@questmaster.test'),
  ('Ana', 'Costa', 'ana@questmaster.test'),
  ('Kai', 'Nakamura', 'kai@questmaster.test'),
  ('Fatima', 'Ali', 'fatima@questmaster.test'),
  ('Jack', 'Turner', 'jack@questmaster.test'),
  ('Ines', 'Dubois', 'ines@questmaster.test'),
  ('Sam', 'Park', 'sam@questmaster.test'),
  ('Lena', 'Novak', 'lena@questmaster.test'),
  ('Theo', 'Martin', 'theo@questmaster.test'),
  ('Rosa', 'Lopez', 'rosa@questmaster.test'),
  ('Isaac', 'Mensah', 'isaac@questmaster.test'),
  ('Chloe', 'Evans', 'chloe@questmaster.test'),
  ('Arjun', 'Mehta', 'arjun@questmaster.test'),
  ('Ella', 'Jansen', 'ella@questmaster.test')
) AS s(first_name, last_name, email)
ON CONFLICT (email) DO NOTHING;

-- Finished quests for the demo users, about one a day going back from today.
-- Points follow the app's rule (1 point per minute, max 120), so harder quests
-- give more. Alex also gets 3 quests planned for today to show on My Tasks.
-- Only users with no quests yet get rows, so running the seed again adds nothing.
WITH demo(email, finished, planned_today, shift) AS (
  VALUES
    ('maria@questmaster.test', 60, 0, 0),
    ('chris@questmaster.test', 40, 0, 3),
    ('tama@questmaster.test', 32, 0, 6),
    ('priya@questmaster.test', 25, 0, 9),
    ('jordan@questmaster.test', 19, 0, 12),
    ('blair@questmaster.test', 15, 0, 15),
    ('sofia@questmaster.test', 12, 0, 18),
    ('alex@questmaster.test', 10, 3, 21),
    ('omar@questmaster.test', 8, 0, 24),
    ('grace@questmaster.test', 6, 0, 27),
    ('diego@questmaster.test', 5, 0, 2),
    ('hana@questmaster.test', 4, 0, 5),
    ('liam@questmaster.test', 3, 0, 8),
    ('zoe@questmaster.test', 2, 0, 11),
    ('ravi@questmaster.test', 1, 0, 14),
    ('nina@questmaster.test', 0, 0, 17),
    ('ethan@questmaster.test', 48, 0, 20),
    ('aisha@questmaster.test', 35, 0, 23),
    ('lucas@questmaster.test', 28, 0, 26),
    ('mei@questmaster.test', 22, 0, 1),
    ('noah@questmaster.test', 20, 0, 4),
    ('amara@questmaster.test', 17, 0, 7),
    ('ben@questmaster.test', 14, 0, 10),
    ('yuki@questmaster.test', 13, 0, 13),
    ('mateo@questmaster.test', 11, 0, 16),
    ('leila@questmaster.test', 9, 0, 19),
    ('owen@questmaster.test', 9, 0, 22),
    ('ana@questmaster.test', 7, 0, 25),
    ('kai@questmaster.test', 7, 0, 28),
    ('fatima@questmaster.test', 6, 0, 3),
    ('jack@questmaster.test', 5, 0, 6),
    ('ines@questmaster.test', 4, 0, 9),
    ('sam@questmaster.test', 4, 0, 12),
    ('lena@questmaster.test', 3, 0, 15),
    ('theo@questmaster.test', 3, 0, 18),
    ('rosa@questmaster.test', 2, 0, 21),
    ('isaac@questmaster.test', 2, 0, 24),
    ('chloe@questmaster.test', 1, 0, 27),
    ('arjun@questmaster.test', 1, 0, 0),
    ('ella@questmaster.test', 0, 0, 5)
),
demo_users AS (
  SELECT u.id AS user_id, d.finished, d.planned_today, d.shift
  FROM demo AS d
  JOIN users AS u ON u.email = d.email
  WHERE NOT EXISTS (SELECT 1 FROM user_tasks AS ut WHERE ut.user_id = u.id)
),
numbered_tasks AS (
  SELECT id, difficulty, ROW_NUMBER() OVER (ORDER BY id) AS n, COUNT(*) OVER () AS total
  FROM tasks
),
finished AS (
  SELECT du.user_id, t.id AS task_id, g,
         -- quest length in minutes, which is also the points earned
         CASE t.difficulty
           WHEN 'easy' THEN 10 + (g * 3) % 11
           WHEN 'medium' THEN 25 + (g * 7) % 21
           ELSE 55 + (g * 11) % 41
         END AS minutes,
         NOW() - g * INTERVAL '1 day' - (g * 37 % 240) * INTERVAL '1 minute' AS done_at
  FROM demo_users AS du
  CROSS JOIN generate_series(1, du.finished) AS g
  JOIN numbered_tasks AS t ON t.n = (du.shift + g * 7) % t.total + 1
)
INSERT INTO user_tasks (user_id, task_id, planned_for, started_at, completed_at, points_earned)
SELECT user_id, task_id, done_at::date, done_at - minutes * INTERVAL '1 minute', done_at, minutes
FROM finished
UNION ALL
SELECT du.user_id, t.id, CURRENT_DATE, NULL, NULL, 0
FROM demo_users AS du
CROSS JOIN generate_series(1, du.planned_today) AS g
JOIN numbered_tasks AS t ON t.n = (du.shift + g * 5) % t.total + 1;
