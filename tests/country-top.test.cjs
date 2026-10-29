const test = require('node:test');
const assert = require('node:assert/strict');
const { countryTop } = require('./load-api.cjs')('country-top');

test('country tops use the matching all-time metric, not rating or weekly trending', () => {
  const response = {
    topRated: [{ anime: { id: 'highest-rating' } }],
    trending: [{ anime: { id: 'weekly' } }],
    topViewed: [{ anime: { id: 'most-viewed' }, views: 12 }],
    topReviewed: [{ anime: { id: 'most-reviewed' }, reviews: 8 }],
  };
  assert.equal(countryTop(response, 'reviews').items, response.topReviewed);
  assert.equal(countryTop(response, 'vistos').items, response.topViewed);
  assert.equal(countryTop(response, 'popularidad').items, response.topViewed);
  assert.match(countryTop(response, 'popularidad').label, /todo el tiempo/);
  assert.deepEqual(countryTop(response, 'anime').items, []);
  assert.deepEqual(countryTop(undefined, 'reviews').items, []);
  assert.deepEqual(countryTop({}, 'vistos').items, []);
});
