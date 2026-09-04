const CSRF_COOKIE_NAME = 'csrf_token';

function readCsrfToken(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(ApiError.extractMessage(body, status));
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  private static extractMessage(body: unknown, status: number): string {
    if (body && typeof body === 'object' && 'error' in body) {
      const { error } = body as { error: unknown };
      if (typeof error === 'string') return error;
    }
    return `Request failed with status ${status}`;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  // The CSRF cookie is set by the server on any GET request - the app always fetches
  // /api/auth/me on boot, so a token is available before the first mutating request.
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = readCsrfToken();
    if (csrfToken) headers.set('x-csrf-token', csrfToken);
  }

  const response = await fetch(`/api${path}`, { ...options, method, headers });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
