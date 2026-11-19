import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMoshimoCode } from '../lib/moshimo-code-core.mjs';

const CODE = `<a href="//af.moshimo.com/af/c/click?a_id=10&amp;p_id=1863&amp;pc_id=20&amp;pl_id=30" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc><img src="//image.moshimo.com/af-img/1203/banner.jpg" width="300" height="250" style="border:none;"></a><img src="//i.moshimo.com/af/i/impression?a_id=10&amp;p_id=1863&amp;pc_id=20&amp;pl_id=30" width="1" height="1" style="border:none;" loading="lazy">`;

test('もしもの完全な300x250原稿を安全なURLと必須属性へ分解する', () => {
  const parsed = parseMoshimoCode(CODE, { expectedProgramId: '1863' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.programId, '1863');
  assert.equal(parsed.creativeId, '30');
  assert.deepEqual(parsed.linkAttributes, {
    rel: 'nofollow noopener sponsored',
    referrerPolicy: 'no-referrer-when-downgrade',
    attributionSrc: true,
  });
  assert.deepEqual(parsed.fields, {
    htmlContent:
      'https://af.moshimo.com/af/c/click?a_id=10&p_id=1863&pc_id=20&pl_id=30',
    imageUrl: 'https://image.moshimo.com/af-img/1203/banner.jpg',
    trackingPixelUrl:
      'https://i.moshimo.com/af/i/impression?a_id=10&p_id=1863&pc_id=20&pl_id=30',
    width: 300,
    height: 250,
    adType: 'banner',
  });
});

test('案件IDとpixel識別子の不一致をfail-closedにする', () => {
  assert.equal(
    parseMoshimoCode(CODE, { expectedProgramId: '55' }).error,
    'program-id-mismatch:1863'
  );
  assert.equal(
    parseMoshimoCode(CODE.replace('pl_id=30" width="1', 'pl_id=31" width="1'))
      .error,
    'tracking-identifiers-mismatch'
  );
});

test('必須計測属性とcanonicalサイズを落とさない', () => {
  assert.equal(
    parseMoshimoCode(CODE.replace(' attributionsrc', '')).error,
    'attributionsrc-missing'
  );
  assert.equal(
    parseMoshimoCode(
      CODE.replace(' width="300" height="250"', ' width="468" height="60"')
    ).error,
    'non-canonical-size:468x60'
  );
  assert.equal(
    parseMoshimoCode(CODE.replace(/<img src="\/\/i\.moshimo\.com[^>]+>/, ''))
      .error,
    'no-moshimo-impression-pixel'
  );
});
