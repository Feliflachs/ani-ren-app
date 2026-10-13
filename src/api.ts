export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);
export type RequestOptions = {
  method?: string;
  body?: unknown;
  key?: string;
  signal?: AbortSignal;
};
export async function request<T>(
  path: string,
  token: string | null,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 30000);
  try {
    const response = await fetch(API_URL + path, {
      method: options.method || 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        response.status,
        data.error?.code || 'HTTP_ERROR',
        data.error?.fields?.map((field: { message: string }) => field.message).join('\n') ||
          data.error?.message ||
          'No pudimos completar la operación.',
      );
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      0,
      'CONNECTION',
      'No pudimos conectar con el servidor. Revisá la conexión y reintentá.',
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
export function query(path: string, values: Record<string, string | number | undefined | null>) {
  const params = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    .join('&');
  return path + (params ? (path.includes('?') ? '&' : '?') + params : '');
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error. Reintentá.';
export function appendUnique<T>(previous: T[], incoming: T[], identity: (item: T) => string): T[] {
  const map = new Map(previous.map((item) => [identity(item), item]));
  incoming.forEach((item) => map.set(identity(item), item));
  return [...map.values()];
}
// An ambiguous POST keeps the same payload and key until resolved.
export class Submission {
  private attempt?: { path: string; body: string; key: string };
  prepare(path: string, body: unknown, makeKey: () => string) {
    const serialized = JSON.stringify(body);
    if (this.attempt && (this.attempt.path !== path || this.attempt.body !== serialized))
      throw new Error('Primero reintentá el envío pendiente con su contenido original.');
    this.attempt ??= { path, body: serialized, key: makeKey() };
    return this.attempt.key;
  }
  resolve() {
    this.attempt = undefined;
  }
}
