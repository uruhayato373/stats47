const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertRecordIntegrity,
  isVerifiedXPostUrl,
} = require('../sns-posts-store.cjs');

test('Xの実投稿URLはstatus URLだけを許可する', () => {
  assert.equal(isVerifiedXPostUrl('https://x.com/stats47jp373/status/123'), true);
  assert.equal(isVerifiedXPostUrl('https://twitter.com/stats47jp373/status/123?ref=share'), true);
  assert.equal(isVerifiedXPostUrl('https://x.com/stats47jp373'), false);
  assert.equal(isVerifiedXPostUrl('https://stats47.jp/ranking/example'), false);
});

test('activeなX postedレコードは確認済みpost_urlを必須にする', () => {
  assert.throws(
    () => assertRecordIntegrity({ id: 1, platform: 'x', status: 'posted', post_url: null }),
    /確認済み post_url が必要/,
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({
      id: 2,
      platform: 'x',
      status: 'posted',
      post_url: 'https://x.com/stats47jp373/status/123',
    }),
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({ id: 3, platform: 'x', status: 'scheduled', post_url: null }),
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({ id: 4, platform: 'x', status: 'posted', post_url: null, deleted_at: '2026-09-04' }),
  );
});
