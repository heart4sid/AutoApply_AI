// ============================================================
// AutoApply AI — Centralized API Client
// Reads NEXT_PUBLIC_API_URL, auto-attaches auth tokens,
// handles 401 refresh, and provides structured errors.
// ============================================================

import { useAuthStore } from '@/stores/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse(response: Response) {
  if (response.ok) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  let body: any = {};
  try {
    body = await response.json();
  } catch {
    // Response body is not JSON
  }

  const message = Array.isArray(body.message)
    ? body.message.join(', ')
    : body.message || `Request failed with status ${response.status}`;

  throw new ApiError(response.status, message, body);
}

function getAuthHeaders(): Record<string, string> {
  const tokens = useAuthStore.getState().tokens;
  if (tokens?.accessToken) {
    return { Authorization: `Bearer ${tokens.accessToken}` };
  }
  return {};
}

async function refreshAndRetry(method: string, url: string, options?: RequestInit): Promise<any> {
  const { tokens, setAuth, clearAuth } = useAuthStore.getState();

  if (!tokens?.refreshToken) {
    clearAuth();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  try {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!refreshResponse.ok) {
      clearAuth();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const data = await refreshResponse.json();
    setAuth(data.user, data.tokens);

    // Retry the original request with the new token
    const retryHeaders = {
      ...options?.headers,
      Authorization: `Bearer ${data.tokens.accessToken}`,
    };

    const retryResponse = await fetch(url, {
      ...options,
      method,
      headers: retryHeaders,
    });

    return handleResponse(retryResponse);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    clearAuth();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
}

async function request(method: string, path: string, options?: {
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
}) {
  let url = `${API_BASE}${path}`;

  // Append query params
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(method !== 'GET' && options?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...(options?.body && {
      body: options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body),
    }),
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Auto-refresh on 401
    if (response.status === 401) {
      return refreshAndRetry(method, url, fetchOptions);
    }

    return handleResponse(response);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Network error — could not reach the API server.');
  }
}

export const apiClient = {
  get: (path: string, params?: Record<string, string | number | undefined>) =>
    request('GET', path, { params }),

  post: (path: string, body?: any) =>
    request('POST', path, { body }),

  patch: (path: string, body?: any) =>
    request('PATCH', path, { body }),

  put: (path: string, body?: any) =>
    request('PUT', path, { body }),

  delete: (path: string) =>
    request('DELETE', path),

  upload: (path: string, formData: FormData) =>
    request('POST', path, { body: formData }),
};
