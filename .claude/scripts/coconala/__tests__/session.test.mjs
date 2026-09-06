import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownProfileId, readListings } from '../lib/coconala-session.mjs';

test('recommended seller is not the logged-in owner', () => {
  assert.equal(ownProfileId([
    { href: '/users/2064680', text: 'おすすめ出品者' },
    { href: '/users/6198620', text: '表示を確認する' },
  ]), '6198620');
});
test('missing, conflicting and foreign profile evidence fails closed', () => {
  assert.equal(ownProfileId([]), '');
  assert.equal(ownProfileId([{ href: 'https://example.com/users/6198620', text: '表示を確認する' }]), '');
  assert.equal(ownProfileId(['1', '2'].map(id => ({ href: '/users/' + id, text: '表示を確認する' }))), '');
});
test('configured revision counts reach the form layer', () => {
  assert.equal(readListings()['P-01'].fixLimit, '-1');
  assert.equal(readListings()['GEO-SERVICE-01'].fixLimit, '1');
});
