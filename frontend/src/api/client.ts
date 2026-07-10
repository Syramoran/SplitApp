const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const TOKEN_KEY = 'splitapp_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && token && !path.startsWith('/auth')) {
    // Sesión vencida: limpiar y volver al login
    tokenStore.clear();
    window.location.assign('/login');
    throw new ApiError(401, 'Sesión vencida');
  }

  if (!response.ok) {
    let message = 'Algo salió mal';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {
      // sin body JSON
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}
