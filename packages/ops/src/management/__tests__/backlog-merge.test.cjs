'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeBacklog } = require('../backlog-merge.cjs');
const { parseBacklog } = require('../backlog-lib.cjs');

const doc = (red, yellow) => [
  '---',
  'title: backlog',
  '---',
  '',
  '## 🔴 高 — 今月中に着手したい',
  '',
  ...red.flatMap((c) => [c, '']),
  '## 🟡 中 — 2〜3ヶ月以内',
  '',
  ...yellow.flatMap((c) => [c, '']),
].join('\n');

const card = (id, body = '本文。') => `### [${id}] ${id} の題\nタグ: [収益化] [種類:改善] [実行:対話]\n\n- ${body}`;
const ids = (text) => parseBacklog(text).map((c) => `${c.tier}:${c.id}`);

test('同じ文書を 3 つ渡すと一字一句そのまま返す (空行の数も変えない)', () => {
  const t = `${doc([card('A-01')], [card('B-01'), card('B-02')])}\n\n### [X-01] 空行なしで続くカード\n`;
  const r = mergeBacklog(t, t, t);
  assert.equal(r.ok, true);
  assert.equal(r.text, t);
});

test('両側が同じ章の先頭にカードを足しただけなら、両方を残す (2026-11-21 の W46 の衝突)', () => {
  const base = doc([card('A-01')], [card('B-01')]);
  const ours = doc([card('A-01')], [card('OURS-01'), card('B-01')]);
  const theirs = doc([card('A-01')], [card('THEIRS-01'), card('B-01')]);
  const r = mergeBacklog(base, ours, theirs);
  assert.equal(r.ok, true);
  assert.deepEqual(ids(r.text).sort(), ['high:A-01', 'mid:B-01', 'mid:OURS-01', 'mid:THEIRS-01']);
  assert.equal(r.stats.fromTheirs, 1);
  assert.doesNotMatch(r.text, /^(<<<<<<<|=======|>>>>>>>)/m);
});

test('自分が消したカードは消えたまま、相手が足したカードは入る', () => {
  const base = doc([card('A-01'), card('A-02')], []);
  const ours = doc([card('A-02')], []);
  const theirs = doc([card('A-01'), card('A-02'), card('A-03')], []);
  const r = mergeBacklog(base, ours, theirs);
  assert.equal(r.ok, true);
  assert.deepEqual(ids(r.text), ['high:A-02', 'high:A-03']);
  assert.equal(r.stats.removed, 0);
});

test('別々のカードの書き換えは両方とも採る', () => {
  const base = doc([card('A-01'), card('A-02')], []);
  const ours = doc([card('A-01', '自分が直した'), card('A-02')], []);
  const theirs = doc([card('A-01'), card('A-02', '相手が直した')], []);
  const r = mergeBacklog(base, ours, theirs);
  assert.equal(r.ok, true);
  assert.match(r.text, /自分が直した/);
  assert.match(r.text, /相手が直した/);
});

test('同じカードを両側が別々に書き換えたら解かず、結果を返さない', () => {
  const base = doc([card('A-01')], []);
  const r = mergeBacklog(base, doc([card('A-01', '自分')], []), doc([card('A-01', '相手')], []));
  assert.equal(r.ok, false);
  assert.equal(r.text, undefined);
  assert.deepEqual(r.conflicts, ['同じカードを両側が別々に変えた: A-01']);
});

test('自分が書き換えたカードを相手が消したら解かない', () => {
  const base = doc([card('A-01'), card('A-02')], []);
  const r = mergeBacklog(base, doc([card('A-01', '自分'), card('A-02')], []), doc([card('A-02')], []));
  assert.equal(r.ok, false);
});

test('相手が別の章へ移したカードは、移した先に置く', () => {
  const base = doc([card('A-01'), card('A-02')], [card('B-01')]);
  const ours = doc([card('A-01'), card('A-02'), card('A-03')], [card('B-01')]);
  const theirs = doc([card('A-01')], [card('B-01'), card('A-02')]);
  const r = mergeBacklog(base, ours, theirs);
  assert.equal(r.ok, true);
  assert.deepEqual(ids(r.text), ['high:A-01', 'high:A-03', 'mid:B-01', 'mid:A-02']);
});

test('章の並びが違うときは構造の変更として解かない', () => {
  const base = doc([card('A-01')], []);
  const theirs = base.replace('## 🟡 中 — 2〜3ヶ月以内', '## 🟢 低 — 再開条件を満たしたら着手する');
  const r = mergeBacklog(base, base, theirs);
  assert.equal(r.ok, false);
});

test('前置き (frontmatter) を両側が別々に変えたら解かない', () => {
  const base = doc([card('A-01')], []);
  const r = mergeBacklog(base, base.replace('title: backlog', 'title: 自分'), base.replace('title: backlog', 'title: 相手'));
  assert.equal(r.ok, false);
});

test('コードフェンスの中の ### はカードの区切りにしない', () => {
  const fenced = card('A-01', '例:\n\n```markdown\n### [FAKE-01] フェンスの中\n```');
  const base = doc([fenced], []);
  const theirs = doc([fenced, card('A-02')], []);
  const r = mergeBacklog(base, base, theirs);
  assert.equal(r.ok, true);
  assert.deepEqual(ids(r.text), ['high:A-01', 'high:A-02']);
  assert.match(r.text, /### \[FAKE-01\] フェンスの中/);
});
