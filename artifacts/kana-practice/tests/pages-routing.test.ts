import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, usePagesLocation } from '../src/routing/hash-location';

test('Pages hash routes retain review filters and quick-session options on direct links', () => {
  assert.deepEqual(parseHash('#/review?kind=kanji&quick=1&direction=recognition'), {
    pathname: '/review', search: 'kind=kanji&quick=1&direction=recognition',
  });
  assert.deepEqual(parseHash(''), { pathname: '/', search: '' });
  assert.deepEqual(parseHash('#/library'), { pathname: '/library', search: '' });
  assert.deepEqual(parseHash('#/custom?search=a%3Fb'), { pathname: '/custom', search: 'search=a%3Fb' });
  assert.equal(usePagesLocation.hrefs('/review?quick=1'), '#/review?quick=1');
});
