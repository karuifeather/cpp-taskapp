// Task catalog data for the Task Catalog page.
import { apiFetch } from './api.js';

// Returns [{ id, name, task_count }]
export async function getCategories() {
  return (await apiFetch('/categories')).categories;
}

// Returns [{ id, title, description, difficulty, category_id, category }]
// (category is the category name)
export async function getTasks() {
  return (await apiFetch('/tasks')).tasks;
}

// Adds a catalog task to the logged in user's list. plannedFor is optional
// (YYYY-MM-DD); the server uses today when it is left out.
export async function addTask(taskId, plannedFor) {
  const body = plannedFor ? { taskId, plannedFor } : { taskId };
  const data = await apiFetch('/user-tasks', { method: 'POST', body: JSON.stringify(body) });
  return data.user_task;
}

// Removes a task from the logged in user's list (DELETE /api/user-tasks/:id).
// The server says 409 when the task was already started.
export async function removeTask(userTaskId) {
  await apiFetch(`/user-tasks/${userTaskId}`, { method: 'DELETE' });
}

// Returns the logged in user's planned (not started) tasks, any day.
// Each item has id (the user task id) and task_id (the catalog task id).
export async function getPlannedTasks() {
  return (await apiFetch('/user-tasks?status=planned')).user_tasks;
}
