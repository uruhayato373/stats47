import assert from 'node:assert/strict';
import test from 'node:test';

import { loadRegionTable, lintRegionClaims, rankTables } from '../region-claim-lint.mjs';

const article = (body) => `---\ntitle: 題\n---\n\n${body}\n`;
const rules = (body, gt) => lintRegionClaims(article(body), gt).map((f) => f.rule);

/** 図 1 枚分の根拠データ。並べた順が順位 */
function truth(prefs) {
  const gt = {};
  prefs.forEach((p, i) => {
    gt[p] = [{ rank: i + 1, value: 100 - i, source: 'a.json' }];
  });
  return gt;
}
const ALL = Object.values(loadRegionTable()).flat();

test('地方の表は packages/area の 7 区分 47 都道府県を読む', () => {
  const table = loadRegionTable();
  assert.equal(Object.keys(table).length, 7);
  assert.equal(new Set(Object.values(table).flat()).size, 47);
  assert.ok(table['中部'].includes('新潟'));
  assert.ok(table['近畿'].includes('三重'));
});

test('地方に属さない県を検出する', () => {
  assert.deepEqual(rules('東北の新潟県は上位です。'), ['membership']);
  assert.deepEqual(rules('首都圏では兵庫県が目立ちます。'), ['membership']);
  assert.deepEqual(rules('北海道・東北の新潟県が並びます。'), ['membership']);
  assert.deepEqual(rules('山形県、富山県、新潟県といった北陸が並びます。'), ['membership']);
});

test('正しいくくりと、別の地方へ続く並びは検出しない', () => {
  assert.deepEqual(rules('東北の秋田県と山形県が並びます。'), []);
  assert.deepEqual(rules('四国の高知県、北海道が続きます。'), []);
  assert.deepEqual(rules('九州の沖縄県は別の傾向です。'), []);
  assert.deepEqual(rules('鹿児島県、徳島県など九州・四国が並びます。'), []);
  assert.deepEqual(rules('中国の輸入品が多いです。'), []);
  // 2026-11-04 に公開記事で誤検知した形
  assert.deepEqual(rules('島根県、山梨県といった東北以外の県も並びます。'), []);
  assert.deepEqual(rules('関東・中部の東京都と愛知県は下位です。'), []);
  assert.deepEqual(rules('静岡県、大阪府といった東海地方から近畿地方にかけての県です。'), []);
  assert.deepEqual(rules('福島・鳥取といった東北や地方が上位です。'), []);
  assert.deepEqual(rules('鹿児島県、徳島県など九州・中国四国の県です。'), []);
});

test('地方の端の主張を図の順位に照らす', () => {
  const gt = truth(['岡山', '広島', ...ALL.filter((p) => p !== '岡山' && p !== '広島')]);
  assert.deepEqual(rules('中国で最も高い広島県が続きます。', gt), ['superlative']);
  assert.deepEqual(rules('中国で最も高い岡山県が続きます。', gt), []);
  // どれか 1 枚の図で成り立てば通す
  const other = truth(['広島', '岡山', ...ALL.filter((p) => p !== '岡山' && p !== '広島')]);
  for (const [p, facts] of Object.entries(other)) gt[p].push({ ...facts[0], source: 'b.json' });
  assert.deepEqual(rules('中国で最も高い広島県が続きます。', gt), []);
  // 「最も高く、2位の岡山」は別の県の話
  assert.deepEqual(rules('鳥取が中国の中で最も高く、2位の岡山が続きます。', truth(ALL)), []);
});

test('上位の県の地方の主張を図の順位に照らす', () => {
  const gt = truth(['福岡', '佐賀', '東京', ...ALL.filter((p) => !['福岡', '佐賀', '東京'].includes(p))]);
  assert.deepEqual(rules('上位3県はすべて九州です。', gt), ['all-in']);
  assert.deepEqual(rules('上位2県はすべて九州です。', gt), []);
  assert.deepEqual(rules('上位3県はいずれも九州・関東の県です。', gt), []);
  assert.deepEqual(rules('1位の東京都を除く上位3県はすべて九州です。', gt), []);
  assert.deepEqual(rules('上位3県には九州、四国の県が並びます。', gt), ['listed']);
  assert.deepEqual(rules('上位3県に四国の県は入っていません。', gt), []);
});

test('地方の県の数を超える数を検出する', () => {
  assert.deepEqual(rules('四国の5県が並びます。'), ['count']);
  assert.deepEqual(rules('九州・沖縄の8県が並びます。'), []);
});

test('日本海側・内陸県の分類を検出する', () => {
  assert.deepEqual(rules('日本海側の長野県が並びます。'), ['coast']);
  assert.deepEqual(rules('内陸県の山形が並びます。'), ['coast']);
  assert.deepEqual(rules('日本海側の新潟県が並びます。'), []);
  assert.deepEqual(rules('内陸の山形は盆地です。'), []);
});

test('県の網羅が足りない図は順位の照合に使わない', () => {
  const gt = truth(['東京', '大阪']);
  assert.equal(rankTables(gt).length, 0);
  assert.deepEqual(rules('上位2県はすべて九州です。', gt), []);
});
