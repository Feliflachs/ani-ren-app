const test = require('node:test'),
  assert = require('node:assert/strict');
const load = require('./load-api.cjs');
const { createRemoteStore } = load('remote');
function deferred() {
  let resolve;
  return { promise: new Promise((r) => (resolve = r)), resolve: (v) => resolve(v) };
}

test('liking updates the entity without resetting feed pages; deletion removes the cached publication', async () => {
  const publication = {
    id: '42',
    kind: 'post',
    userId: 'a',
    author: { id: 'a', name: 'A', handle: 'a' },
    createdAt: new Date().toISOString(),
    text: 'Post',
    animeIds: [],
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
  const store = createRemoteStore({
    request: async (route) =>
      route.endsWith('/like')
        ? { publicationId: '42', likeCount: 1, likedByMe: true }
        : { deletedPublicationId: '42' },
  });
  store.activate();
  store.ingest(publication);
  const before = store.pageRevision('/feed');
  await store.mutate('/publications/42/like', { method: 'PUT' });
  assert.equal(store.pageRevision('/feed'), before);
  assert.equal(store.pageRevision('/discover'), before);
  assert.equal(store.rawPublications.get('42').likeCount, 1);
  assert.equal(store.rawPublications.get('42').likedByMe, true);
  await store.mutate('/publications/42', { method: 'DELETE' });
  assert.equal(store.rawPublications.has('42'), false);
  assert.ok(store.pageRevision('/feed') > before);
});

test('repeated taps on a pending social action send only one request', async () => {
  const pending = deferred();
  let requests = 0;
  const store = createRemoteStore({
    request: () => {
      requests++;
      return pending.promise;
    },
  });
  store.activate();
  const first = store.action('/publications/42/like', { method: 'PUT' });
  await store.action('/publications/42/like', { method: 'PUT' });
  assert.equal(requests, 1);
  pending.resolve({ publicationId: '42', likeCount: 1, likedByMe: true });
  await first;
});
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

test('feed metadata preserves a previously loaded Spanish synopsis', async () => {
  const { adaptAnime } = load('remote');
  const row = {
    id: 'mal:6',
    externalId: 6,
    title: 'Trigun',
    synopsis: 'English [Written by MAL Rewrite]',
    synopsisEs: 'Sinopsis castellana',
    statistics: { averageRating: null },
    genres: [],
  };
  const store = createRemoteStore({ request: async () => ({ anime: row }) });
  store.activate();
  await store.load('/anime/mal:6');
  assert.equal(adaptAnime({ ...row, synopsisEs: undefined }).synopsis, 'Sinopsis castellana');
  assert.equal(adaptAnime({ ...row, synopsisEs: null }).synopsis, 'English');
});

test('cold feed batches anime scores before displaying cards, including repeated anime and no votes', async () => {
  const { adaptAnime } = load('remote');
  const calls = [];
  const basic = (id) => ({ id: `mal:${id}`, externalId: id, title: `Anime ${id}`, genres: [] });
  const store = createRemoteStore({
    request: async (route, options) => {
      calls.push(route);
      if (route === '/anime/statistics') {
        assert.equal(options.query.ids, 'mal:1,mal:2');
        return {
          items: [
            { id: 'mal:1', statistics: { averageRating: 4.25, ratingUserCount: 2 } },
            { id: 'mal:2', statistics: { averageRating: null, ratingUserCount: 0 } },
          ],
        };
      }
      return { items: [{ anime: basic(1) }, { anime: basic(1) }, { anime: basic(2) }] };
    },
  });
  store.activate();
  const result = await store.load('/feed');
  assert.deepEqual(calls, ['/feed', '/anime/statistics']);
  assert.equal(adaptAnime(result.items[0].anime).rating, 4.25);
  assert.equal(adaptAnime(result.items[1].anime).rating, 4.25);
  assert.equal(adaptAnime(result.items[2].anime).rating, 0);
  assert.equal(
    adaptAnime({ ...result.items[0].anime, statistics: { averageRating: null } }).rating,
    0,
  );
});

test('changing accounts during score hydration discards the old response', async () => {
  const pending = deferred();
  const a = createRemoteStore({
    request: async (route) =>
      route === '/anime/statistics'
        ? pending.promise
        : { anime: { id: 'mal:1', externalId: 1, title: 'Old account anime' } },
  });
  a.activate();
  const old = a.load('/feed');
  await new Promise((resolve) => setImmediate(resolve));
  const b = createRemoteStore({ request: async () => ({}) });
  b.activate();
  pending.resolve({ items: [{ id: 'mal:1', statistics: { averageRating: 5 } }] });
  await assert.rejects(old, /sesión cambió/);
});
