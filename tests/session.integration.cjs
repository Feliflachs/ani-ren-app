// Requires the sibling backend and its dependencies. Uses only its isolated test database.
const path = require('node:path');
const assert = require('node:assert/strict');
const load = require('./load-api.cjs');
const { createApiClient } = load('client');
const { createSession } = load('session');
const backend = path.resolve(__dirname, '../../ani-ren-backend');
require(require.resolve('tsx/cjs', { paths: [backend] }));
const { fixture } = require(path.join(backend, 'tests/fixture.ts'));

async function main() {
  process.chdir(backend);
  const server = await fixture();
  let saved = null;
  const storage = {
    get: async () => saved,
    set: async (value) => {
      saved = value;
    },
    remove: async () => {
      saved = null;
    },
  };
  const makeClient = (getToken) =>
    createApiClient({
      baseUrl: 'http://fixture/api',
      getToken,
      fetcher: async (url, options) => {
        const token = options.headers.Authorization?.slice(7);
        // fixture.request performs real HTTP to an ephemeral localhost server.
        const result = await server.request(
          new URL(url).pathname.replace('/api', ''),
          token ? { id: '', token } : undefined,
          {
            method: options.method,
            body: options.body === undefined ? undefined : JSON.parse(options.body),
          },
        );
        return result.status === 204
          ? new Response(null, { status: 204 })
          : Response.json(result.body, { status: result.status });
      },
    });
  try {
    const session = createSession(storage, makeClient);
    await session.restore();
    const registered = await session.register('frontend_test', 'Password123');
    assert.equal(session.getSnapshot().user, null);
    assert.equal(await session.signIn('frontend_test', 'Password123'), true);
    assert.equal(session.getSnapshot().user.id, registered.user.id);
    assert.equal(session.getSnapshot().user.statistics.watched, 0);
    await session.updateProfile({ name: 'Perfil real', bio: 'Guardada en backend' });
    const restored = createSession(storage, makeClient);
    await restored.restore();
    assert.equal(restored.getSnapshot().user.name, 'Perfil real');
    assert.equal(restored.getSnapshot().user.bio, 'Guardada en backend');
    const oldToken = saved;
    await restored.signOut();
    assert.equal(saved, null);
    assert.equal(
      (await server.request('/auth/me', { id: registered.user.id, token: oldToken })).status,
      401,
    );
    console.log(
      'PASS: registro → login → perfil → restauración → logout/revocación contra backend real.',
    );
  } finally {
    await server.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
