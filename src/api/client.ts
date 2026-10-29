export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  operationId?: string;
  signal?: AbortSignal;
  authenticated?: boolean;
};

type ClientOptions = {
  baseUrl: string;
  getToken: () => string | null;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

/** No automatic retries: a write may have committed even when its response was lost. */
export function createApiClient({
  baseUrl,
  getToken,
  fetcher = fetch,
  timeoutMs = 20_000,
}: ClientOptions) {
  const base = baseUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/?#]+(?:\/[^?#]*)?\/api$/.test(base)) {
    throw new Error(
      'Configurá EXPO_PUBLIC_API_URL con la dirección del backend terminada en /api.',
    );
  }

  async function request<T>(route: string, options: RequestOptions = {}): Promise<T> {
    if (!route.startsWith('/') || route.startsWith('//') || /[?#]/.test(route)) {
      throw new Error('La ruta debe ser relativa a /api; los filtros van en query.');
    }
    const token = options.authenticated === false ? null : getToken();
    if (options.authenticated !== false && !token) {
      throw new ApiError(401, 'SESSION_REQUIRED', 'Iniciá sesión para continuar.');
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) query.set(key, String(value));
    }
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const response = await fetcher(`${base}${route}${query.size ? `?${query}` : ''}`, {
        method: options.method ?? 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(options.operationId ? { 'Idempotency-Key': options.operationId } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      if (response.status === 204) return undefined as T;
      const raw = await response.text();
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new ApiError(
          response.status,
          'INVALID_RESPONSE',
          'El servidor devolvió una respuesta inválida.',
        );
      }
      if (!response.ok) {
        throw new ApiError(
          response.status,
          typeof payload?.error?.code === 'string' ? payload.error.code : 'HTTP_ERROR',
          typeof payload?.error?.message === 'string'
            ? payload.error.message
            : 'No se pudo completar la solicitud.',
        );
      }
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (options.signal?.aborted) throw error;
      throw new ApiError(
        0,
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        timedOut
          ? 'El servidor tardó demasiado. Volvé a intentarlo.'
          : 'No pudimos conectar con el servidor. Revisá tu conexión.',
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  }
  return { request };
}

export type ApiClient = ReturnType<typeof createApiClient>;
