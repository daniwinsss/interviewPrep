const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

export const API_BASE_URL = configuredApiUrl || '';
export const SOCKET_BASE_URL = (
  configuredSocketUrl
  || configuredApiUrl
  || (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

export function apiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
