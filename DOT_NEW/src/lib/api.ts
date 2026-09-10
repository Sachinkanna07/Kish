const base = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export type ApiSession = { csrf_token: string; user: { name: string; role: 'FARMER' | 'AUTHORITY' | 'ADMIN' } };

export async function api<T>(path: string, options: RequestInit = {}, csrf?: string): Promise<T> {
  const response = await fetch(`${base}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'The service is temporarily unavailable.' }));
    throw new Error(body.detail ?? 'The request could not be completed.');
  }
  return response.json() as Promise<T>;
}

export const auth = {
  requestOtp: (identifier: string) => api<{ accepted: boolean; development_code?: string }>('/auth/farmer/request-otp', { method: 'POST', body: JSON.stringify({ identifier }) }),
  verifyOtp: (identifier: string, code: string) => api<ApiSession>('/auth/farmer/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, code }) }),
  staffLogin: (role: 'authority' | 'admin', login: string, password: string) => api<ApiSession>(`/auth/${role}/login`, { method: 'POST', body: JSON.stringify({ login, password }) }),
};

export function events(path: '/ws/farmer' | `/ws/authority/centre/${string}` | '/ws/admin/network', onEvent: (event: unknown) => void) {
  const url = new URL(base); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${url.origin}${path}`);
  socket.onmessage = (message) => onEvent(JSON.parse(message.data));
  return () => socket.close();
}
