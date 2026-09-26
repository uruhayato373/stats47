'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const {
  STANCES,
  parseLanes,
  resolveImprovementLane,
  parseFocusLanes,
  parseWeeklyItems,
  auditLaneAlignment,
  laneBoard,
} = require('../strategy-lanes.cjs');

/**
 * 戦略レーンの配線テスト。意図: 「攻める」レーンにだけ月次の重点を置け、週次 Must が重点から外れたら
 * 見える、凍結レーンの作業は計画に入らない。全 PASS が何も見ていないのと区別できるよう、
 * 各規則について「発火する側」と「発火しない側」を両方固定する。
 */

const STRATEGY = [
  '# 収益化戦略',
  '<!-- strategy-lanes:start -->',
  '| 順 | レーン | 構え | 今の狙い | 構えを変える条件 | 改善Metric |',
  '|---|---|---|---|---|---|',
  '| 1 | 計測 | 攻める | 計器を戻す | 4週取得 | ga4 |',
  '| 2 | 行政資料 | 攻める | pilot | Stop | — |',
  '| 3 | SEO・ブログ | 維持 | 上限内 | 変換率 | gsc, content |',
  '| 4 | SNS | 凍結 | 止める | 送客 | note |',
  '<!-- strategy-lanes:end -->',
].join('\n');

const BACKLOG = [
  '## 🔴 高',
  '',
  '### [MEASURE-A-01] 計器を戻す',
  'タグ: [インフラ・計測] [種類:改善] [実行:対話] [レーン:計測]',
  '',
  '### [BLOG-B-01] ブログを足す',
  'タグ: [コンテンツ品質] [種類:制作] [実行:対話] [レーン:SEO・ブログ]',
  '',
  '### [BLOG-FIX-01] ブログの壊れを直す',
  'タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [レーン:SEO・ブログ]',
  '',
  '### [SNS-C-01] SNS を増やす',
  'タグ: [SNS・マーケ] [種類:制作] [実行:対話] [レーン:SNS]',
  '',
  '### [NOLANE-01] レーン無し',
  'タグ: [UI・UX] [種類:改善] [実行:対話]',
].join('\n');

const IMPROVEMENTS = [
  '## Tier 1 (P0/P1)',
  '',
  '| ID | タイトル | Status | Due | Owner | Metric |',
  '|---|---|---|---|---|---|',
  '| GA-X-01 | 計測 | pending | 2026-10-01 | claude | ga4 |',
  '| NOTE-Y-01 | note | pending | 2026-10-01 | claude | ga4/note |',
].join('\n');

const monthly = (lanes) => ['---', 'title: 今月', lanes, '---', '', '# 本文'].join('\n');
const weekly = (must, should = []) => ['## 今週のタスク', '', '### Must（3件）', '', ...must, '', '### Should', '', ...should, ''].join('\n');

function run({ focus = 'focus_lanes: [計測]', must = ['- [ ] **計器** — `MEASURE-A-01`'], should = [], strategy = STRATEGY } = {}) {
  return auditLaneAlignment({
    strategyText: strategy,
    backlogText: BACKLOG,
    improvementsText: IMPROVEMENTS,
    monthlyText: monthly(focus),
    weeklyText: weekly(must, should),
  });
}
const codes = (r) => r.issues.map((i) => `${i.level}:${i.code}`);

test('レーン表を順・構え・改善Metric込みで読む', () => {
  const { lanes, errors } = parseLanes(STRATEGY);
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(lanes.map((l) => l.name), ['計測', '行政資料', 'SEO・ブログ', 'SNS']);
  assert.deepStrictEqual(lanes[2].improvementMetrics, ['gsc', 'content']);
  assert.deepStrictEqual(lanes[1].improvementMetrics, []);
  assert.ok(STANCES.includes(lanes[3].stance));
});

test('表の破損 (語彙外の構え・重複・マーカー欠落) は DG073', () => {
  assert.match(parseLanes(STRATEGY.replace('| 維持 |', '| 様子見 |')).errors[0], /構えが語彙外/);
  assert.match(parseLanes(STRATEGY.replace('| SNS |', '| 計測 |')).errors.join(), /レーン名が重複/);
  assert.match(parseLanes('# 表なし').errors[0], /マーカー/);
  assert.ok(codes(run({ strategy: '# 表なし' })).includes('error:DG073'));
});

test('改善Metric は対応のある最後の語でレーンを引く', () => {
  const { lanes } = parseLanes(STRATEGY);
  assert.strictEqual(resolveImprovementLane('ga4', lanes), '計測');
  assert.strictEqual(resolveImprovementLane('ga4/note', lanes), 'SNS');
  assert.strictEqual(resolveImprovementLane('ga4/unknown', lanes), '計測');
  assert.strictEqual(resolveImprovementLane('performance', lanes), null);
});

test('focus_lanes は inline と block の両形式を読み、無ければ null', () => {
  assert.deepStrictEqual(parseFocusLanes(monthly('focus_lanes: [計測, 行政資料]')), ['計測', '行政資料']);
  assert.deepStrictEqual(parseFocusLanes(monthly('focus_lanes:\n  - 計測\n  - "行政資料"')), ['計測', '行政資料']);
  assert.strictEqual(parseFocusLanes(monthly('focus_themes: [a]')), null);
});

test('整合している計画は DG074〜078 を出さない (DG075 のレーン未設定集計だけ)', () => {
  assert.deepStrictEqual(codes(run()), ['warning:DG075']);
});

test('重点に「維持」「凍結」や未知のレーンを置くと DG076 error', () => {
  assert.ok(codes(run({ focus: 'focus_lanes: [SEO・ブログ]' })).includes('error:DG076'));
  assert.ok(codes(run({ focus: 'focus_lanes: [存在しない]' })).includes('error:DG076'));
  assert.ok(codes(run({ focus: 'focus_themes: [x]' })).includes('warning:DG076'));
});

test('Must が重点レーン外なら DG077、ただし不具合カードは例外', () => {
  const off = run({ must: ['- [ ] **ブログ追加** — `BLOG-B-01`'] });
  assert.ok(codes(off).includes('warning:DG077'));
  assert.strictEqual(off.weekly.find((w) => w.section === 'Must').status, 'off-focus');
  const defect = run({ must: ['- [ ] **ブログ修正** — `BLOG-FIX-01`'] });
  assert.ok(!codes(defect).includes('warning:DG077'));
});

test('Must が ID を参照しないとレーンを引けず DG077、improvements の ID は Metric から引く', () => {
  assert.ok(codes(run({ must: ['- [ ] **ID なしの作業** [M]'] })).includes('warning:DG077'));
  const imp = run({ must: ['- [ ] **GA** — `GA-X-01`'] });
  assert.ok(!codes(imp).includes('warning:DG077'));
  assert.deepStrictEqual(imp.weekly[0].lanes, ['計測']);
});

test('凍結レーンの作業は Must 以外の節にあっても DG078 error', () => {
  const r = run({ should: ['- [ ] **SNS** — `SNS-C-01`'] });
  assert.ok(codes(r).includes('error:DG078'));
  assert.strictEqual(r.weekly.find((w) => w.section === 'Should').status, 'frozen');
});

test('backlog の語彙外レーンは DG074 error', () => {
  const r = auditLaneAlignment({
    strategyText: STRATEGY,
    backlogText: '## 🔴 高\n\n### [X-01] x\nタグ: [UI・UX] [種類:改善] [実行:対話] [レーン:存在しない]\n',
    improvementsText: '',
    monthlyText: monthly('focus_lanes: [計測]'),
    weeklyText: '',
  });
  assert.ok(codes(r).includes('error:DG074'));
});

test('週次の項目から節・ID・完了状態を取る', () => {
  const items = parseWeeklyItems(weekly(['- [x] **済** — `MEASURE-A-01` と `GA-X-01`']));
  assert.deepStrictEqual(items[0], {
    section: 'Must',
    line: 5,
    done: true,
    text: '済',
    ids: ['MEASURE-A-01', 'GA-X-01'],
  });
});

test('実リポジトリの収益化戦略のレーン表は壊れていない', () => {
  const root = path.resolve(__dirname, '..', '..', '..', '..');
  assert.ok(fs.existsSync(path.join(root, 'docs/00_プロジェクト管理/02_収益化戦略.md')));
  const board = laneBoard(root);
  assert.deepStrictEqual(board.issues.filter((i) => i.level === 'error'), []);
  assert.ok(board.lanes.length >= 3);
});
