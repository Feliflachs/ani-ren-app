const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-api.cjs');
const { createSession } = load('session');
const { createApiClient } = load('client');
const profile = {
  id: 'real-account',
  name: 'Ana',
  handle: 'ana',
  bio: '',
  avatarUrl: null,
  statistics: {
    watched: 12,
    watchlist: 3,
    reviews: 2,
    posts: 0,
    followers: 4,
    following: 5,
    friends: 1,
  },
  favorites: [],
};
function fixture(saved = null) {
  let stored = saved;
  const calls = [];
  const routes = {
    '/auth/login': () =>
      Response.json({ user: profile, token: 'real-token', expiresAt: '2099-01-01' }),
    '/auth/me': () => Response.json({ user: profile }),
    '/users/real-account': () => Response.json({ user: profile }),
    '/auth/register': () => Response.json({ user: profile }, { status: 201 }),
    '/auth/logout': () => new Response(null, { status: 204 }),
    '/me/profile': (_, options) =>
      Response.json({ user: { ...profile, ...JSON.parse(options.body) } }),
  };
  const storage = {
    get: async () => stored,
    set: async (value) => {
      stored = value;
    },
    remove: async () => {
      stored = null;
    },
  };
  const session = createSession(storage, (getToken) =>
    createApiClient({
      baseUrl: 'http://server/api',
      getToken,
      fetcher: async (url, options) => {
        const route = new URL(url).pathname.replace('/api', '');
        calls.push([route, options]);
        return routes[route](url, options);
      },
    }),
  );
  return { session, storage, routes, calls, stored: () => stored };
}
test('new account loads server profile before publishing login and persists token only', async () => {
  const f = fixture();
  await f.session.restore();
  assert.equal(await f.session.signIn(' ana ', 'Password1'), true);
  assert.equal(f.stored(), 'real-token');
  assert.equal(f.session.getSnapshot().user.statistics.watched, 12);
  assert.deepEqual(
    f.calls.map(([route]) => route),
    ['/auth/login', '/users/real-account'],
  );
  assert.equal(f.session.getSnapshot().generation, 1);
});
test('registration never authenticates and duplicate-account errors reach the form', async () => {
  const f = fixture();
  await f.session.register('ana', 'Password1');
  assert.equal(f.session.getSnapshot().user, null);
  assert.equal(f.stored(), null);
  f.routes['/auth/register'] = () =>
    Response.json({ error: { code: 'CONFLICT', message: 'Ya existe' } }, { status: 409 });
  await assert.rejects(f.session.register('ana', 'Password1'), { status: 409 });
});
test('invalid credentials do not become a session', async () => {
  const f = fixture();
  f.routes['/auth/login'] = () =>
    Response.json({ error: { code: 'INVALID_CREDENTIALS' } }, { status: 401 });
  assert.equal(await f.session.signIn('ana', 'wrong'), false);
  assert.equal(f.stored(), null);
  assert.equal(f.session.getSnapshot().user, null);
});
test('restore validates token remotely and retains it on network failure for retry', async () => {
  const f = fixture('saved');
  f.routes['/auth/me'] = () => {
    throw new Error('offline');
  };
  await f.session.restore();
  assert.equal(f.stored(), 'saved');
  assert.equal(f.session.getSnapshot().user, null);
  assert.ok(f.session.getSnapshot().error);
  assert.equal(f.session.getSnapshot().ready, true);
  f.routes['/auth/me'] = () => Response.json({ user: profile });
  await f.session.restore();
  assert.equal(f.session.getSnapshot().user.id, profile.id);
  assert.equal(f.session.getSnapshot().error, '');
});
test('expired token clears persisted session and private context generation', async () => {
  const f = fixture('expired');
  f.routes['/auth/me'] = () =>
    Response.json({ error: { code: 'SESSION_EXPIRED' } }, { status: 401 });
  await f.session.restore();
  assert.equal(f.stored(), null);
  assert.equal(f.session.getSnapshot().user, null);
  assert.equal(f.session.getSnapshot().generation, 1);
});
test('failed token storage revokes new session without opening protected screens', async () => {
  const f = fixture();
  f.storage.set = async () => {
    throw new Error('storage unavailable');
  };
  await assert.rejects(f.session.signIn('ana', 'Password1'), /storage unavailable/);
  assert.equal(f.session.getSnapshot().user, null);
  assert.equal(f.calls.at(-1)[0], '/auth/logout');
});
test('logout revokes remotely, clears storage, and changes context generation', async () => {
  const f = fixture();
  await f.session.signIn('ana', 'Password1');
  await f.session.signOut();
  assert.equal(f.stored(), null);
  assert.equal(f.session.getSnapshot().user, null);
  assert.equal(f.session.getSnapshot().generation, 2);
});
test('profile save uses confirmed server fields and retains statistics', async () => {
  const f = fixture();
  await f.session.signIn('ana', 'Password1');
  await f.session.updateProfile({ name: 'Nuevo', bio: 'Bio' });
  assert.equal(f.session.getSnapshot().user.name, 'Nuevo');
  assert.equal(f.session.getSnapshot().user.statistics.watched, 12);
});
test('old profile response cannot overwrite the next signed-in account', async () => {
  const f = fixture();
  await f.session.signIn('ana', 'Password1');
  let finish;
  f.routes['/me/profile'] = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const saving = f.session.updateProfile({ name: 'Old', bio: '' });
  await f.session.signOut();
  finish(Response.json({ user: { ...profile, name: 'Old' } }));
  await saving;
  assert.equal(f.session.getSnapshot().user, null);
});
