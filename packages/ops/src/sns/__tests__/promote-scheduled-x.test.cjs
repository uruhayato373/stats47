const assert = require('node:assert/strict');
const test = require('node:test');

const { isVerifiedPostUrl } = require('../promote-scheduled-x.cjs');

test('Xの実投稿URLだけを確認済みとして扱う', () => {
  assert.equal(isVerifiedPostUrl('https://x.com/stats47jp373/status/123'), true);
  assert.equal(isVerifiedPostUrl('https://twitter.com/stats47jp373/status/123'), true);
  assert.equal(isVerifiedPostUrl('https://x.com/stats47jp373'), false);
  assert.equal(isVerifiedPostUrl('https://x.com/home'), false);
  assert.equal(isVerifiedPostUrl('https://x.com/stats47jp373/status/not-a-number'), false);
  assert.equal(isVerifiedPostUrl('https://stats47.jp/ranking/example'), false);
  assert.equal(isVerifiedPostUrl(null), false);
});
