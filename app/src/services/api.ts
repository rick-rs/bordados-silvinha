const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_URL is required');
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function extractApiErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const maybeDetailedData = data as { detail?: unknown };

  if (typeof maybeDetailedData.detail === 'string') {
    return maybeDetailedData.detail;
  }

  const fieldMessages = Object.entries(data)
    .flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => `${field}: ${message}`);
      }

      if (typeof value === 'string') {
        return [`${field}: ${value}`];
      }

      return [];
    })
    .filter(Boolean);

  return fieldMessages.length > 0 ? fieldMessages.join(' ') : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('bordados-app:token') ? { Authorization: `Bearer ${localStorage.getItem('bordados-app:token')}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json')
    ? await response.json()
    : null;

  if (response.status === 401 && localStorage.getItem("bordados-app:token")) {
    localStorage.removeItem("bordados-app:token");
    localStorage.removeItem("bordados-app:user");
    window.dispatchEvent(new Event("session-changed"));
  }

  if (!response.ok) {
    const message =
      extractApiErrorMessage(data) ?? 'Nao foi possivel completar a solicitacao.';

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export { apiBaseUrl };
