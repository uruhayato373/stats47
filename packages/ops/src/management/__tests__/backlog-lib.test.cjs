'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  TIER,
  TODO_LAYER_FILES,
  CANONICAL_CATEGORIES,
  EXECUTORS,
  KINDS,
  ID_PATTERN,
  parseTagLine,
  splitHeadingId,
  parseBacklog,
  findOrphanHeadings,
  pickTasks,
} = require('../backlog-lib.cjs');

/**
 * backlog-lib (v3-unified) のテスト。
 * doboku-note `tests/backlog-lib.test.mjs` の主要ケースを移植し、stats47 拡張
 * ([ID] / [期日:] / [進行中] / startLine・endLine) の両方向を固定する。
 * 「全 PASS は何も見ていないと区別がつかない」ため、非抽出 (化けない) 側も必ず固定する。
 */

const FIXTURE = [
  '# バックログ',
  '',
  '## 🔴 高 — 今月着手',
  '',
  '### [FEAT-A-01] 高優先のタスク',
  'タグ: [収益化] [種類:不具合] [実行:sweep] [検証:npm test] [起票:2026-08-01] [期日:2026-08-31]',
  '',
  '本文 1 行目。',
  '',
  '```bash',
  '## フェンス内の見出しもどき (tier に化けてはいけない)',
  '### フェンス内のカードもどき',
  'タグ: [偽タグ]',
  'echo ok',
  '```',
  '',
  '### ID なしの分類待ちカード',
  '',
  '説明だけがある。',
  '',
  '## 🟡 中',
  '',
  '### [FEAT-B-02] 進行中のタスク',
  'タグ: [UI・UX] [種類:改善] [実行:機械] [進行中] [Codex候補]',
  '',
  '### [FEAT-C-03] ユーザー待ち',
  'タグ: [インフラ・計測] [実行:ユーザー]',
  '',
  '## 🟣 判断待ち',
  '',
  '### [DEC-D-04] 意思決定が要る',
  'タグ: [エージェント・SSOT] [種類:意思決定]',
  '',
].join('\n');

test('カード抽出: tier・ID・タグ行の全フィールド', () => {
  const cards = parseBacklog(FIXTURE);
  assert.equal(cards.length, 5);

  const a = cards[0];
  assert.equal(a.id, 'FEAT-A-01');
  assert.equal(a.title, '高優先のタスク');
  assert.equal(a.tier, 'high');
  assert.equal(a.category, '収益化');
  assert.equal(a.kind, '不具合');
  assert.equal(a.executor, 'sweep');
  assert.equal(a.verify, 'npm test');
  assert.equal(a.filed, '2026-08-01');
  assert.equal(a.due, '2026-08-31');
  assert.equal(a.hasTagLine, true);
  assert.equal(a.wip, false);
});

test('★フェンス内の ## / ### / タグ: は構造にならない (本文として保持)', () => {
  const cards = parseBacklog(FIXTURE);
  const a = cards[0];
  // フェンスの中身が本文に残る
  assert.match(a.body, /フェンス内の見出しもどき/);
  // フェンス内 ### が別カードに化けていない
  assert.ok(!cards.some((c) => c.title.includes('フェンス内のカードもどき')));
  // フェンス内の偽タグを拾っていない
  assert.equal(a.category, '収益化');
});

test('stats47 拡張: [進行中] → wip / [Codex候補] → codex', () => {
  const cards = parseBacklog(FIXTURE);
  const b = cards.find((c) => c.id === 'FEAT-B-02');
  assert.equal(b.wip, true);
  assert.equal(b.codex, true);
  assert.equal(b.executor, '機械');
  // 進行中でないカードは wip=false
  assert.equal(cards.find((c) => c.id === 'FEAT-C-03').wip, false);
});

test('ID 抽出の非誤爆: ハイフン無し・小文字・非 ID ブラケットはタイトルに残す', () => {
  // ID_PATTERN に合わないブラケットは ID に化けない (両方向の固定)
  assert.deepEqual(splitHeadingId('[WIP] 作業中の何か'), { id: null, title: '[WIP] 作業中の何か' });
  assert.deepEqual(splitHeadingId('[abc-01] 小文字'), { id: null, title: '[abc-01] 小文字' });
  assert.deepEqual(splitHeadingId('[ABC01] ハイフン無し'), { id: null, title: '[ABC01] ハイフン無し' });
  assert.deepEqual(splitHeadingId('[ABC-01] 正しい ID'), { id: 'ABC-01', title: '正しい ID' });
  // ID 無し見出しのカードは id=null
  const cards = parseBacklog(FIXTURE);
  const noId = cards.find((c) => c.title === 'ID なしの分類待ちカード');
  assert.equal(noId.id, null);
});

test('startLine / endLine: 行番号削除に使える範囲 (末尾空行は含めない)', () => {
  const lines = FIXTURE.split('\n');
  const cards = parseBacklog(FIXTURE);
  for (const c of cards) {
    // startLine は ### 見出しの行
    assert.match(lines[c.startLine - 1], /^###\s/, `${c.title} の startLine`);
    // endLine は空行でない
    assert.notEqual(lines[c.endLine - 1].trim(), '', `${c.title} の endLine`);
    assert.ok(c.endLine >= c.startLine);
  }
  // 範囲でカードを削除しても他のカードが不変 (round-trip)
  const target = cards.find((c) => c.id === 'FEAT-C-03');
  const kept = lines.filter((_, i) => i + 1 < target.startLine || i + 1 > target.endLine);
  const after = parseBacklog(kept.join('\n'));
  assert.equal(after.length, cards.length - 1);
  assert.deepEqual(
    after.map((c) => c.title),
    cards.filter((c) => c.id !== 'FEAT-C-03').map((c) => c.title),
  );
});

test('未知トークンを沈黙させない: 未知 kv → unknownKeys / 語彙外カテゴリ → unknownCategories', () => {
  const t = parseTagLine('[謎キー:値] [独自カテゴリ] [種類：不具合]');
  assert.deepEqual(t.unknownKeys, [{ key: '謎キー', value: '値', raw: '謎キー:値' }]);
  assert.deepEqual(t.unknownCategories, ['独自カテゴリ']);
  // 全角コロンも kv として受理する
  assert.equal(t.kind, '不具合');
});

test('orphan 見出し: tier セクション外の ### を検出する', () => {
  const text = ['### 迷子のカード', '', '## 🔴 高', '', '### [IN-TIER-01] 正常'].join('\n');
  const orphans = findOrphanHeadings(text);
  assert.equal(orphans.length, 1);
  assert.equal(orphans[0].title, '迷子のカード');
  // parseBacklog も迷子をカードにしない
  assert.equal(parseBacklog(text).length, 1);
});

test('pickTasks: 4 バケットが総数の真の分割 + 不具合が先頭', () => {
  const picked = pickTasks(parseBacklog(FIXTURE), { limit: 5 });
  assert.equal(picked.total, 5);
  assert.equal(picked.partitionOk, true);
  // runnable = sweep(FEAT-A) + 機械(FEAT-B)。不具合 (FEAT-A) が先
  assert.deepEqual(picked.run.map((c) => c.id), ['FEAT-A-01', 'FEAT-B-02']);
  assert.equal(picked.excludedTotal, 1); // ユーザー待ち
  assert.equal(picked.holdTotal, 1); // 🟣
  assert.equal(picked.unclassifiedTotal, 1); // ID なし分類待ち
});

test('mutation: 語彙とレイヤ宣言が仕様どおり (潰すと落ちる)', () => {
  assert.deepEqual(KINDS, ['不具合', '改善', '意思決定', '制作', '定期']);
  assert.deepEqual(EXECUTORS, ['sweep', '機械', '対話', 'ユーザー', 'windows', '別環境']);
  assert.equal(CANONICAL_CATEGORIES.length, 6);
  assert.deepEqual(Object.keys(TIER), ['🔴', '🟡', '🟢', '🟣']);
  assert.deepEqual(TODO_LAYER_FILES, ['backlog.md', 'weekly.md', 'monthly.md', 'improvements.md']);
  // docs-governance の idPattern と同形であること
  assert.ok(ID_PATTERN.test('GIT-HISTORY-SECRET-PURGE-01'));
  assert.ok(!ID_PATTERN.test('lowercase-id'));
});

test('CRLF 入力でも同じ結果 (Windows 編集耐性)', () => {
  const crlf = FIXTURE.replace(/\n/g, '\r\n');
  const a = parseBacklog(crlf)[0];
  assert.equal(a.id, 'FEAT-A-01');
  assert.equal(a.executor, 'sweep');
});

// ── 待ちの理由 [待ち:X] / 年間計画 annual.md / 期日で引く (2026-11-14)。
// 意図: backlog に「時期待ち」「観測待ち」のカードが溜まり、いつ・何を待っているかが機械で読めなかった。
// 待ちの理由をタグで持たせ、時期待ちは年間計画へ、期日で月次・週次へ引けるようにする。
const lib = require('../backlog-lib.cjs');

test('[待ち:X] は 1 枚に複数付けられ、waits に書いた順で入る (重複は 1 つ)', () => {
  const t = parseTagLine('[収益化] [実行:対話] [待ち:承認] [待ち:ログイン] [待ち:承認]');
  assert.deepStrictEqual(t.waits, ['承認', 'ログイン']);
  assert.deepStrictEqual(t.unknownKeys, [], '待ち は語彙内のキー');
  assert.strictEqual(t.executor, '対話', '他のキーの読みは変わらない');
});

test('[待ち:X] の語彙は 5 つで、語彙外の値もパースは寛容に保持する (検査が error にする)', () => {
  assert.deepStrictEqual(lib.WAITS, ['承認', '時期', '観測', 'ログイン', '判断']);
  assert.deepStrictEqual(parseTagLine('[待ち:そのうち]').waits, ['そのうち']);
});

test('タグ行の無いカードも waits は空配列 (読み手が null を気にしない)', () => {
  const cards = parseBacklog('## 🟡 中\n\n### [W-A-01] タグなし\n本文');
  assert.deepStrictEqual(cards[0].waits, []);
  assert.strictEqual('month' in cards[0], false, 'backlog のカードに month は付けない (既存の形を変えない)');
});

const ANNUAL = [
  '---',
  'title: 年間計画',
  'type: annual-plan',
  'status: active',
  'updated: 2026-11-14',
  '---',
  '',
  '# 年間計画',
  '',
  '### [ANN-ORPHAN-01] 月見出しの外 (カードにならない)',
  '',
  '## 2026-12 — 年末',
  '',
  '### [ANN-DEC-01] 年末の作業',
  'タグ: [収益化] [種類:制作] [実行:対話] [待ち:時期] [期日:2026-12-20]',
  '',
  '本文。',
  '',
  '```bash',
  '## 2027-01 フェンス内の月見出しもどき',
  '### フェンス内のカードもどき',
  '```',
  '',
  '## 2027-01',
  '',
  '### [ANN-JAN-01] 年明けの作業',
  'タグ: [インフラ・計測] [期日:2027-01-15]',
  '',
  '## メモ',
  '',
  '### [ANN-MEMO-01] 月見出しでない章の下 (カードにならない)',
].join('\n');

test('parseAnnual は月見出しの下のカードだけを読み、month を持たせる (フェンス内は構造にしない)', () => {
  const cards = lib.parseAnnual(ANNUAL);
  assert.deepStrictEqual(cards.map((c) => [c.id, c.month, c.tier, c.due]), [
    ['ANN-DEC-01', '2026-12', null, '2026-12-20'],
    ['ANN-JAN-01', '2027-01', null, '2027-01-15'],
  ]);
  assert.deepStrictEqual(cards[0].waits, ['時期']);
  assert.match(cards[0].body, /フェンス内の月見出しもどき/, 'フェンスは本文に残る');
  assert.deepStrictEqual(lib.findAnnualOrphanHeadings(ANNUAL).map((o) => o.title.split(' ')[0]), [
    '[ANN-ORPHAN-01]',
    '[ANN-MEMO-01]',
  ]);
});

test('[mutation] 月として読めない見出し (13 月・日付付き) は月見出しにしない', () => {
  const text = '## 2026-13\n\n### [X-A-01] a\n\n## 2026-12-01\n\n### [X-B-01] b\n\n## 2026-12\n\n### [X-C-01] c';
  assert.deepStrictEqual(lib.parseAnnual(text).map((c) => c.id), ['X-C-01']);
  assert.deepStrictEqual(parseBacklog(text), [], 'backlog のパーサは月見出しを tier にしない');
});

test('cardsDueWithin は期日が範囲内 (両端含む) と超過を分けて返し、source を付ける', () => {
  const backlogText = [
    '## 🔴 高',
    '### [B-OVER-01] 超過',
    'タグ: [収益化] [期日:2026-11-30]',
    '### [B-FROM-01] 範囲の始まり',
    'タグ: [収益化] [期日:2026-12-01]',
    '### [B-NODUE-01] 期日なし',
    'タグ: [収益化]',
    '### [B-BAD-01] 日付でない',
    'タグ: [収益化] [期日:2026-12-32]',
    '### [B-AFTER-01] 範囲の後',
    'タグ: [収益化] [期日:2027-01-01]',
  ].join('\n');
  const r = lib.cardsDueWithin({ backlogText, annualText: ANNUAL, from: '2026-12-01', to: '2026-12-31' });
  assert.deepStrictEqual(r.due.map((c) => [c.id, c.source]), [['B-FROM-01', 'backlog'], ['ANN-DEC-01', 'annual']]);
  assert.deepStrictEqual(r.overdue.map((c) => [c.id, c.source]), [['B-OVER-01', 'backlog']]);
  // 範囲の終わりちょうども含む
  const end = lib.cardsDueWithin({ backlogText, from: '2026-11-01', to: '2026-11-30' });
  assert.deepStrictEqual(end.due.map((c) => c.id), ['B-OVER-01']);
  assert.deepStrictEqual(end.overdue, []);
});

test('cardsDueWithin は日付を引数でしか受けず、読めない日付は例外にする', () => {
  assert.throws(() => lib.cardsDueWithin({ backlogText: '', from: '2026-12', to: '2026-12-31' }), /YYYY-MM-DD/);
  assert.throws(() => lib.cardsDueWithin({ backlogText: '', from: '2026-12-31', to: '2026-12-01' }), /from が to より後/);
  assert.deepStrictEqual(lib.cardsDueWithin({ from: '2026-12-01', to: '2026-12-01' }), { due: [], overdue: [] }, '本文が無ければ空');
});
