const test = require('node:test'),
  assert = require('node:assert/strict');
const load = require('./load-api.cjs');
const { createRemoteStore } = load('remote');
function deferred() {
  let resolve;
  return { promise: new Promise((r) => (resolve = r)), resolve: (v) => resolve(v) };
}
test('a late response from a previous account never enters the next account cache', async () => {
  const pending = deferred();
  const a = createRemoteStore({ request: () => pending.promise });
  a.activate();
  const request = a.load('/users/first');
  const b = createRemoteStore({
    request: async () => ({ user: { id: 'second', handle: 'second', name: 'Second' } }),
  });
  b.activate();
  await b.load('/users/second');
  pending.resolve({ user: { id: 'first', handle: 'first', name: 'First' } });
  await assert.rejects(request, /sesión cambió/);
  assert.equal(b.rawUsers.has('first'), false);
  assert.equal(b.rawUsers.has('second'), true);
});
test('same write retains its idempotency key after a lost response and uses a new key after success', async () => {
  const keys = [];
  let fail = true;
  const store = createRemoteStore({
    request: async (route, options) => {
      keys.push(options.operationId);
      if (fail) {
        fail = false;
        throw Error('response lost');
      }
      return { rating: { id: '1' } };
    },
  });
  store.activate();
  const body = { animeId: 'mal:1', rating: 4, countryCode: 'AR' };
  await assert.rejects(store.mutate('/ratings', { method: 'POST', body }));
  await store.mutate('/ratings', { method: 'POST', body });
  await store.mutate('/ratings', { method: 'POST', body });
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[1], keys[2]);
});
test('a mutation starts a fresh query even if an older read is pending', async () => {
  const pending = deferred();
  let calls = 0;
  const store = createRemoteStore({
    request: async (route, options) => {
      if (options.method) return { ok: true };
      calls++;
      return calls === 1 ? pending.promise : { items: [{ id: 'new' }] };
    },
  });
  store.activate();
  const old = store.load('/feed');
  await store.mutate('/me/favorites', { method: 'PUT', body: { animeIds: [] } });
  const fresh = await store.load('/feed');
  assert.equal(fresh.items[0].id, 'new');
  pending.resolve({ items: [{ id: 'old' }] });
  await old;
  assert.equal(store.get(JSON.stringify(['/feed', {}])).items[0].id, 'new');
});
test('empty filtered catalog pages preserve nextPage instead of ending pagination', async () => {
  const store = createRemoteStore({ request: async () => ({ items: [], nextPage: 2 }) });
  store.activate();
  const result = await store.load('/search', { type: 'anime', genres: 'mal:22', page: 1 });
  assert.deepEqual(result, { items: [], nextPage: 2 });
});
test('profile adapters preserve real totals when a feed supplies only basic identity', async () => {
  const store = createRemoteStore({ request: async () => ({}) });
  store.activate();
  store.ingest({
    user: {
      id: 'one',
      handle: 'one',
      name: 'One',
      statistics: { watched: 123, reviews: 25, followers: 40 },
      rank: { name: 'Experto' },
      auraPoints: 600,
    },
  });
  store.ingest({ author: { id: 'one', handle: 'one', name: 'One' } });
  assert.equal(store.rawUsers.get('one').statistics.watched, 123);
  assert.equal(load('remote').adaptUser({ id: 'one', handle: 'one', name: 'One' }).watched, 123);
});

test('late activity reads cannot overwrite activity refreshed after a write', async () => {
  const pending = deferred();
  let reads = 0;
  const store = createRemoteStore({
    request: async (route, options) => {
      if (options.method) return { ok: true };
      return ++reads === 1 ? pending.promise : { rating: 5 };
    },
  });
  store.activate();
  const route = '/me/anime/mal%3A1/activity';
  const old = store.load(route);
  await store.mutate('/ratings/one', { method: 'PATCH', body: { rating: 5 } });
  await store.load(route);
  pending.resolve({ rating: 1 });
  await old;
  assert.equal(store.activity.get('mal:1').rating, 5);
});
