const path = require('node:path'),
  assert = require('node:assert/strict');
const load = require('./load-api.cjs');
const { createApiClient } = load('client');
const { createRemoteStore } = load('remote');
const backend = path.resolve(__dirname, '../../ani-ren-backend');
require(require.resolve('tsx/cjs', { paths: [backend] }));
const { fixture } = require(path.join(backend, 'tests/fixture.ts'));
async function main() {
  process.chdir(backend);
  const server = await fixture();
  try {
    const account = await server.account('remote_test'),
      other = await server.account('another_user');
    let dropNext = false;
    const api = createApiClient({
      baseUrl: 'http://fixture/api',
      getToken: () => account.token,
      fetcher: async (url, options) => {
        const parsed = new URL(url);
        const response = await server.request(
          parsed.pathname.replace('/api', '') + parsed.search,
          account,
          {
            method: options.method,
            body: options.body ? JSON.parse(options.body) : undefined,
            key: options.headers['Idempotency-Key'],
          },
        );
        if (dropNext) {
          dropNext = false;
          throw Error('Response lost after commit');
        }
        return Response.json(response.body, { status: response.status });
      },
    });
    const store = createRemoteStore(api);
    store.activate();
    await store.load('/explore');
    const search = await store.load('/search', { type: 'anime', q: '', page: 1 });
    assert.equal(search.items[0].id, 'mal:1');
    const draft = { animeId: 'mal:1', rating: 4, watchedOn: '2025-01-01', countryCode: 'AR' };
    dropNext = true;
    await assert.rejects(store.mutate('/ratings', { method: 'POST', body: draft }), {
      code: 'NETWORK_ERROR',
    });
    const rating = await store.mutate('/ratings', { method: 'POST', body: draft });
    assert.equal(await server.db.ratingEntry.count({ where: { userId: account.id } }), 1);
    await store.mutate(`/ratings/${rating.rating.id}`, { method: 'PATCH', body: { rating: 4.5 } });
    const review = await store.mutate('/reviews', {
      method: 'POST',
      body: { ...draft, text: 'Una review confirmada desde el cliente.' },
    });
    await store.mutate(`/reviews/${review.publication.id}`, {
      method: 'PATCH',
      body: { rating: 5, text: 'Una review editada desde el cliente.' },
    });
    const fresh = createRemoteStore(api);
    fresh.activate();
    const coldSearch = await fresh.load('/search', { type: 'anime', q: 'Anime', page: 1 });
    assert.equal(coldSearch.items.find(row => row.id === 'mal:1').statistics.averageRating, 5);
    const coldReviews = await fresh.load('/publications', { kind: 'review' });
    assert.equal(coldReviews.items[0].anime.statistics.averageRating, 5);
    store.activate();
    await store.load('/me/anime/mal:1/activity');
    assert.equal(store.activity.get('mal:1').currentRating.rating, 5);
    const post = await store.mutate('/posts', {
      method: 'POST',
      body: { text: 'Un post con #anime', spoiler: false, animeIds: ['mal:1'] },
    });
    await store.mutate(`/publications/${post.publication.id}/comments`, {
      method: 'POST',
      body: { text: 'Comentario confirmado' },
    });
    await store.mutate(`/publications/${post.publication.id}/like`, { method: 'PUT' });
    const detail = await store.load(`/publications/${post.publication.id}`);
    assert.equal(detail.publication.likeCount, 1);
    assert.equal(detail.publication.commentCount, 1);
    const list = await store.mutate('/lists', {
      method: 'POST',
      body: {
        title: 'Lista real',
        description: 'Orden real',
        ordered: true,
        animeIds: ['mal:1', 'mal:4'],
      },
    });
    await store.mutate(`/lists/${list.list.id}`, {
      method: 'PATCH',
      body: { animeIds: ['mal:4', 'mal:1'] },
    });
    await store.mutate(`/lists/${list.list.id}/like`, { method: 'PUT' });
    assert.deepEqual((await store.load(`/lists/${list.list.id}`)).list.animeIds, [
      'mal:4',
      'mal:1',
    ]);
    await store.mutate('/me/favorites', { method: 'PUT', body: { animeIds: ['mal:1'] } });
    await store.mutate('/me/library/mal:4', { method: 'PATCH', body: { watchlist: true } });
    assert.equal(
      (await store.load(`/users/${account.id}/library`, { collection: 'watchlist' })).items[0].anime
        .id,
      'mal:4',
    );
    await store.mutate('/me/missions/watched-1/claim', { method: 'PUT' });
    await store.mutate('/me/missions/watched-1/claim', { method: 'PUT' });
    assert.equal((await store.load('/me/aura')).points, 20);
    assert.equal((await store.load('/ranking', { scope: 'global' })).me.points, 20);
    const map = await store.load('/explore/map', { metric: 'views', period: 'all' });
    assert.equal(map.items.find((row) => row.code === 'AR').views, 2);
    assert.equal((await store.load('/explore/countries/AR')).topRated[0].anime.id, 'mal:1');
    const otherPost = await server.request('/posts', other, {
      method: 'POST',
      key: 'other-post-integration-001',
      body: { text: 'Post de otra cuenta', animeIds: [] },
    });
    assert.equal(otherPost.status, 201);
    assert.equal((await store.load('/feed', { type: 'for-you' })).items.length, 1);
    await store.mutate(`/me/following/${other.id}`, { method: 'PUT' });
    assert.equal((await store.load('/feed', { type: 'for-you' })).items.length, 0);
    assert.equal((await store.load('/feed', { type: 'following' })).items.length, 1);
    await store.load('/discover');
    console.log(
      'PASS all-module contracts, idempotent response-loss retry, mission points and country aggregates.',
    );
  } finally {
    await server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
