import assert from 'node:assert/strict';
import test from 'node:test';

import { TITLE_PROMISE_WARNING_RULES, frontmatterOf, lintTitlePromises } from '../title-promise-lint.mjs';

const article = (title, body, description = '説明') => `---\ntitle: ${title}\ndescription: ${description}\n---\n\n${body}\n`;
const rules = (title, body, gt, description) => lintTitlePromises(article(title, body, description), gt).map((f) => f.rule);

function truth(values) {
  const gt = {};
  for (const [p, v] of Object.entries(values)) gt[p] = [{ rank: 1, value: v, source: 'a.json' }];
  return gt;
}

test('frontmatter の引用符を外して読む', () => {
  const front = frontmatterOf('---\ntitle: "題"\nseoTitle: 検索の題\ndescription: 説明\n---\n本文');
  assert.deepEqual(front, { title: '題', seoTitle: '検索の題', description: '説明' });
});

test('題が倍率を問うのに本文に倍率が無ければ検出する', () => {
  assert.deepEqual(rules('東京と秋田は何倍違う?', '東京は多く、東京が目立ち、秋田は少なく、秋田の値です。'), ['ratio-unanswered']);
  assert.deepEqual(rules('何倍違う?', '差は 2.5 倍です。'), []);
});

test('題の倍率は本文に近い倍率があれば通す', () => {
  assert.deepEqual(rules('5倍の差', '差は約 5.3 倍です。'), []);
  assert.deepEqual(rules('2.4倍の差', '差は 2.45 倍です。'), []);
  assert.deepEqual(rules('1,300倍の差', '差は 1,298 倍です。'), []);
  assert.deepEqual(rules('2.4倍の差', '差は大きいです。'), ['ratio-unbacked']);
  // 「約」は丸めた題なので 5% まで許す
  assert.deepEqual(rules('約1,300倍の差', '差は約 1,285 倍です。'), []);
  assert.deepEqual(rules('1,300倍の差', '差は約 1,285 倍です。'), ['ratio-unbacked']);
});

test('題の倍率が図の比と合わなければ warning の規則で検出する', () => {
  const gt = truth({ 東京: 200, 秋田: 100 });
  const found = rules('東京は秋田の5倍', '東京は多く秋田は少なく、東京と秋田を比べると 5 倍です。', gt);
  assert.deepEqual(found, ['ratio-wrong']);
  assert.ok(TITLE_PROMISE_WARNING_RULES.has('ratio-wrong'));
  assert.deepEqual(rules('東京は秋田の2倍', '東京は多く秋田は少なく、東京と秋田で 2 倍です。', gt), []);
});

test('題の県が本文にほとんど出てこなければ検出する', () => {
  assert.deepEqual(rules('なぜ福井は多い?', '福井は多いです。'), ['pref-absent']);
  assert.deepEqual(rules('なぜ福井は多い?', '福井は多く、福井の背景です。'), []);
});

test('題が理由を約束し本文が断定できないを繰り返すと warning の規則で検出する', () => {
  const body = '断定できません。特定できません。確かめられません。';
  assert.deepEqual(rules('なぜ多い?', body), ['why-unanswered']);
  assert.ok(TITLE_PROMISE_WARNING_RULES.has('why-unanswered'));
  assert.deepEqual(rules('どこが多い?', body), []);
  assert.deepEqual(rules('なぜ多い?', '断定できません。'), []);
});

test('description が並べた視点が見出しより後ろに無ければ検出する', () => {
  const body = '地理と歴史の話です。\n\n## 節\n\n地理の説明です。';
  assert.deepEqual(rules('題', body, undefined, '地理・歴史から読み解きます'), ['viewpoint-absent']);
  assert.deepEqual(rules('題', '導入\n\n## 節\n\n地理と歴史の説明です。', undefined, '地理・歴史の面から読み解きます'), []);
});
