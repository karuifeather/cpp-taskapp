// User task calls for the My Tasks page.
import { apiFetch } from './api.js';

// Every user task for the logged in user: planned, in progress and completed.
export async function getUserTasks() {
  return (await apiFetch('/user-tasks')).user_tasks;
}

// Starts the timer. The server says 409 if another timer is already running.
export async function startTask(userTaskId) {
  return (await apiFetch(`/user-tasks/${userTaskId}/start`, { method: 'PATCH' })).user_task;
}

// Stops the timer. The server works out the points.
export async function stopTask(userTaskId) {
  const data = await apiFetch(`/user-tasks/${userTaskId}/stop`, { method: 'PATCH' });
  return { userTask: data.user_task, points: data.points_awarded };
}
