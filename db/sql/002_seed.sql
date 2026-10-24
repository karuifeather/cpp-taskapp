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
