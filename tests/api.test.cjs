const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Compile only the pure HTTP modules; no Expo/native runtime is needed for contract tests.
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/api', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, require);
  return module.exports;
}
const { createApiClient } = load('client');
const { createAuthApi } = load('auth');
const client = (fetcher, extra = {}) =>
  createApiClient({
    baseUrl: 'http://localhost:3000/api/',
    getToken: () => 'test-token',
    fetcher,
    ...extra,
  });

test('encodes search filters and reads the current token per request', async () => {
  let token = 'first';
  const calls = [];
  const api = client(
    async (url, options) => {
      calls.push([url, options]);
      return Response.json({ items: [], nextPage: 2 });
    },
    { getToken: () => token },
  );
  const page = await api.request('/search', {
    query: { q: 'a & b', genres: 'mal:1,mal:22', page: 1, cursor: undefined },
  });
  assert.equal(page.nextPage, 2);
  token = 'second';
  await api.request('/auth/me');
  const query = new URL(calls[0][0]).searchParams;
  assert.equal(query.get('q'), 'a & b');
  assert.equal(query.has('cursor'), false);
  assert.equal(calls[0][1].headers.Authorization, 'Bearer first');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer second');
});

test('login and registration are public and registration does not promise a token', async () => {
  const calls = [];
  const auth = createAuthApi(
    client(async (url, options) => {
      calls.push([url, options]);
      return Response.json({ user: { id: 'real-user' } }, { status: 201 });
    }),
  );
  const registered = await auth.register('new_user', 'Password1');
  await auth.login('new_user', 'Password1');
  assert.equal(registered.token, undefined);
  for (const [, options] of calls) {
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), { handle: 'new_user', password: 'Password1' });
  }
});

test('refuses private requests without a session before sending them', async () => {
  const api = client(() => assert.fail('must not send'), { getToken: () => null });
  await assert.rejects(api.request('/me/aura'), { status: 401, code: 'SESSION_REQUIRED' });
});

test('preserves HTTP error codes including expired snapshots', async () => {
  for (const status of [401, 409, 410, 429]) {
    const api = client(async () =>
      Response.json({ error: { code: 'SERVER_CODE', message: 'Mensaje' } }, { status }),
    );
    await assert.rejects(api.request('/feed'), { status, code: 'SERVER_CODE', message: 'Mensaje' });
  }
});

test('does not retry writes and preserves the operation key supplied by the caller', async () => {
  let attempts = 0;
  const api = client(async (_, options) => {
    attempts++;
    assert.equal(options.headers['Idempotency-Key'], 'stable-operation');
    throw new TypeError('connection lost');
  });
  await assert.rejects(
    api.request('/ratings', {
      method: 'POST',
      body: { animeId: 'mal:1', rating: 4 },
      operationId: 'stable-operation',
    }),
    { code: 'NETWORK_ERROR' },
  );
  assert.equal(attempts, 1);
});

test('logout accepts an empty 204 response', async () => {
  assert.equal(
    await createAuthApi(client(async () => new Response(null, { status: 204 }))).logout(),
    undefined,
  );
});

test('does not expose HTML from a proxy as an application error', async () => {
  await assert.rejects(
    client(async () => new Response('<html>gateway</html>', { status: 502 })).request('/feed'),
    {
      status: 502,
      code: 'INVALID_RESPONSE',
    },
  );
});

test('aborts timed out requests', async () => {
  const api = client(
    (_, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    { timeoutMs: 5 },
  );
  await assert.rejects(api.request('/feed'), { code: 'TIMEOUT' });
});

test('caller cancellation is not reported as a network failure', async () => {
  const controller = new AbortController();
  const reason = new Error('cancelled by caller');
  const api = client(
    (_, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(reason), { once: true });
      }),
  );
  const pending = api.request('/feed', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error) => error === reason);
});

test('rejects missing configuration and absolute routes', async () => {
  assert.throws(() => client(fetch, { baseUrl: '' }), /EXPO_PUBLIC_API_URL/);
  await assert.rejects(
    client(() => assert.fail('must not send')).request('https://other.test'),
    /relativa/,
  );
});
