// Shared fetch helper for calling the backend. Adds /api, sends the session
// cookie, and throws an Error with the server's message on failure.
// The Error also has a status field (for example 401 when not logged in).
export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
