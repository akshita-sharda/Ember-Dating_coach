// Tiny API client. Same-origin by default (Vite proxies /api in dev; the backend serves the build in prod).
const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function friendly(status, data) {
  if (data && typeof data.detail === 'string') return data.detail;
  if (status === 422) return 'That input looks off. Check the length and try again.';
  if (status === 429) return 'Slow down a bit, try again in a minute.';
  if (status === 403) return 'Please confirm you are 18+ first.';
  return 'Something broke on our side. Try again?';
}

async function request(path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Adult': 'yes' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) throw new ApiError(friendly(res.status, data), res.status);
  return data;
}

export const api = {
  health: () => request('/api/health'),
  personas: () => request('/api/personas'),
  rizz: (body) => request('/api/rizz', body),
  decode: (body) => request('/api/decode', body),
  practice: (body) => request('/api/practice', body),
  glowup: (body) => request('/api/glowup', body),
  coaches: () => request('/api/coaches'),
  lessons: () => request('/api/lessons'),
  lesson: (id) => request(`/api/lessons/${id}`),
  coach: (body) => request('/api/coach', body),
  lessonCheck: (body) => request('/api/lesson-check', body),
};
