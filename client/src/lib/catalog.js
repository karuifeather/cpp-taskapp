// Task catalog data for the Task Catalog page.
//
// The catalog API (GET /api/categories and GET /api/tasks, issue #22) is not
// built yet, so these functions return sample data that matches
// db/sql/002_seed.sql. When #22 is merged, swap the bodies for:
//   getCategories: return apiFetch('/categories');
//   getTasks:      return apiFetch('/tasks');
// The page itself does not need to change.

const SAMPLE_TASKS = [
  ['Homework', 'Read for 20 minutes', 'medium'],
  ['Homework', 'Finish two assignments', 'hard'],
  ['Homework', 'Finish one assignment', 'medium'],
  ['Homework', 'Do 10 math problems', 'medium'],
  ['Homework', 'Write one page of an essay', 'hard'],
  ['Homework', 'Check what homework is due this week', 'easy'],
  ['Exam Review', 'Make flashcards for one topic', 'medium'],
  ['Exam Review', 'Review class notes for 30 minutes', 'medium'],
  ['Exam Review', 'Do one practice test', 'hard'],
  ['Exam Review', 'Study with a friend', 'medium'],
  ['Exam Review', 'Make a study plan for the next exam', 'easy'],
  ['Chores', 'Do your laundry', 'medium'],
  ['Chores', 'Fold your clothes', 'easy'],
  ['Chores', 'Clean your room', 'medium'],
  ['Chores', 'Make your bed', 'easy'],
  ['Chores', 'Wash the dishes', 'easy'],
  ['Chores', 'Cook dinner', 'hard'],
  ['Health', 'Drink two glasses of water', 'easy'],
  ['Health', 'Go for a 20 minute walk', 'medium'],
  ['Health', 'Do a 30 minute workout', 'hard'],
  ['Health', 'Stretch for 10 minutes', 'easy'],
  ['Health', 'Eat a fruit or vegetable', 'easy'],
  ['Health', 'Go to bed before 11 pm', 'medium'],
  ['Personal', 'Read a book for fun', 'easy'],
  ['Personal', 'Practice a hobby or instrument', 'medium'],
  ['Personal', 'Write in a journal', 'easy'],
  ['Personal', 'Call or text a family member', 'easy'],
  ['Personal', 'Plan tomorrow', 'easy'],
  ['Personal', 'Have screen free time for 1 hour', 'hard'],
].map(([category, title, difficulty], index) => ({ id: index + 1, category, title, difficulty }));

const SAMPLE_CATEGORIES = [...new Set(SAMPLE_TASKS.map((task) => task.category))].map(
  (name, index) => ({ id: index + 1, name }),
);

export async function getCategories() {
  return SAMPLE_CATEGORIES;
}

export async function getTasks() {
  return SAMPLE_TASKS;
}
