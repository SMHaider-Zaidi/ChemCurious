export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string | string[]>;
}

export class AdminApiError extends Error {
  status: number;
  details?: Record<string, string | string[]>;

  constructor(message: string, status: number, details?: Record<string, string | string[]>) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Flag determining whether we run in in-memory demo adapter mode.
 * Default is true for Phase 1. Phase 2 flips this to false.
 */
export const IS_ADMIN_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

export async function adminFetch<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, unknown> }
): Promise<T> {
  let url = path;

  if (init?.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(init.query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  let response: Response;
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...defaultHeaders,
        ...init?.headers,
      },
    });
  } catch (err) {
    throw new AdminApiError(
      'Network error: Unable to connect to the chemistry server. Please check your connection.',
      0
    );
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
    }
    throw new AdminApiError('Authentication required. Redirecting to login...', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('Access denied. Administrator privileges required.', 403);
  }

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    let details: Record<string, string | string[]> | undefined;
    try {
      const data: ApiErrorResponse = await response.json();
      if (data?.error) errorMsg = data.error;
      if (data?.details) details = data.details;
    } catch {
      // non-JSON error
    }
    throw new AdminApiError(errorMsg, response.status, details);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
