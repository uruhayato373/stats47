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
  parseKpiMarker,
  auditKpiLinkage,
  MAX_ACTIVE_IMPROVEMENTS,
} = require('../strategy-lanes.cjs');

/**
 * 戦略レーンの配線テスト。意図: 「攻める」レーンにだけ月次の重点を置け、週次 Must が重点から外れたら
 * 見える、凍結レーンの作業は計画に入らない。全 PASS が何も見ていないのと区別できるよう、
 * 各規則について「発火する側」と「発火しない側」を両方固定する。
 */

const STRATEGY = [
  '# 収益化戦略',
  '<!-- strategy-lanes:start -->',
  '| 順 | レーン | 構え | 今の狙い | 構えを変える条件 | 改善Metric | KPI |',
  '|---|---|---|---|---|---|---|',
  '| 1 | 計測 | 攻める | 計器を戻す | 4週取得 | ga4 | measurement-freshness |',
  '| 2 | 行政資料 | 攻める | pilot | Stop | — | — |',
  '| 3 | SEO・ブログ | 維持 | 上限内 | 変換率 | gsc, content | search-clicks |',
  '| 4 | SNS | 凍結 | 止める | 送客 | note | — |',
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
  '| GA-X-01 | 計測 [kpi: measurement-freshness] [target: 鮮度 13/13] | pending | 2026-10-01 | claude | ga4 |',
  '| NOTE-Y-01 | note [kpi: search-clicks] [target: +100 clicks] | pending | 2026-10-01 | claude | ga4/note |',
].join('\n');

const KPI_NODES = [
  { id: 'weekly-revenue', tier: 'nsm' },
  { id: 'search-clicks', tier: 'driver' },
  { id: 'measurement-freshness', tier: 'guardrail' },
];

const monthly = (lanes) => ['---', 'title: 今月', lanes, '---', '', '# 本文'].join('\n');
const weekly = (must, should = []) => ['## 今週のタスク', '', '### Must（3件）', '', ...must, '', '### Should', '', ...should, ''].join('\n');

function run({ focus = 'focus_lanes: [計測]', must = ['- [ ] **計器** — `MEASURE-A-01`'], should = [], strategy = STRATEGY } = {}) {
  return auditLaneAlignment({
    strategyText: strategy,
    backlogText: BACKLOG,
    improvementsText: IMPROVEMENTS,
    monthlyText: monthly(focus),
    weeklyText: weekly(must, should),
    kpiNodes: KPI_NODES,
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

// ── KPI 配線 (DG079 / DG080)。意図: どの KPI を動かすか言えない施策を台帳に置かせない。
// 登録経路は人の直接編集と CI の無人 run の 2 つあり、docs:check はその両方に掛かる。

test('KPI 目印は複数 id をカンマで読み、無ければ null', () => {
  assert.deepStrictEqual(parseKpiMarker('施策 [kpi: search-clicks, site-circulation-rate] [target: +1]'), ['search-clicks', 'site-circulation-rate']);
  assert.strictEqual(parseKpiMarker('施策 [target: +1]'), null);
});

test('配線済みの台帳とレーン表は DG079 / DG080 を出さない', () => {
  const r = run();
  assert.deepStrictEqual(codes(r).filter((c) => /DG079|DG080/.test(c)), []);
  assert.deepStrictEqual(r.lanes[0].kpis, ['measurement-freshness']);
  assert.deepStrictEqual(r.kpiLinks.get('search-clicks'), ['NOTE-Y-01']);
});

test('[kpi:] の無い施策・ツリーに無い id・レーン表の未知 KPI は DG079 error', () => {
  const lanes = parseLanes(STRATEGY.replace('| search-clicks |', '| pv |')).lanes;
  const rows = [
    { id: 'A-01', kpis: null, hasTarget: true },
    { id: 'B-01', kpis: ['pv'], hasTarget: true },
  ];
  const { issues } = auditKpiLinkage({ lanes, improvementRows: rows, kpiNodes: KPI_NODES, files: { strategy: 's', improvements: 'i' } });
  const msgs = issues.filter((i) => i.code === 'DG079' && i.level === 'error').map((i) => i.message).join('\n');
  assert.match(msgs, /A-01 に \[kpi: <id>\] が無い/);
  assert.match(msgs, /B-01 の \[kpi: pv\] が KPI ツリーに無い/);
  assert.match(msgs, /レーン SEO・ブログ の KPI が KPI ツリーに無い: pv/);
});

test('上限超過と [target:] 欠落は DG080 warning、上限ちょうどは出さない', () => {
  const row = (i, hasTarget = true) => ({ id: `R-${i}`, kpis: ['search-clicks'], hasTarget });
  const at = Array.from({ length: MAX_ACTIVE_IMPROVEMENTS }, (_, i) => row(i));
  const audit = (rows) => auditKpiLinkage({ lanes: [], improvementRows: rows, kpiNodes: KPI_NODES, files: {} }).issues.map((i) => i.message);
  assert.deepStrictEqual(audit(at), []);
  assert.match(audit([...at, row('x')]).join(), /上限 \d+ 件を超えている/);
  assert.match(audit([row('y', false)]).join(), /\[target:\] の無い施策 1 件/);
});

test('KPI ツリーが未生成なら検査せず warning だけにする (fixture root で error を出さない)', () => {
  const { issues } = auditKpiLinkage({ lanes: [], improvementRows: [{ id: 'A-01', kpis: null }], kpiNodes: null, files: {} });
  assert.deepStrictEqual(issues.map((i) => `${i.level}:${i.code}`), ['warning:DG079']);
});

test('実リポジトリの台帳・レーン表は KPI ツリーに配線されている (DG079 error 0)', () => {
  const root = path.resolve(__dirname, '../../../..');
  const board = laneBoard(root);
  assert.ok(board.kpiNodes && board.kpiNodes.length > 0, 'kpi-tree.json が無い');
  assert.deepStrictEqual(board.issues.filter((i) => i.code === 'DG079' && i.level === 'error').map((i) => i.message), []);
});

// ── 計画の規律 (DG081 / DG082)。意図: 🔴 が起票時のまま膨らまないこと、連続未達の Must を同じ形で繰り返さないこと。
const { auditPlanDiscipline, parseUnmetMustIds, summarizeReviews, MAX_HIGH_TIER_CARDS, HIGH_TIER_MAX_AGE_DAYS } = require('../strategy-lanes.cjs');

const REVIEW_MISS = (week) => ({
  week,
  text: [`Must **0/2**`, '| Must 1 | 計測 `AAA-01` | M | **未達** | 証拠なし |', '| Must 2 | 是正 `BBB-01` | S | 完了 | ok |'].join('\n'),
});
const planFor = (week, must) => ['---', `week: ${week}`, '---', '### Must', '', ...must, ''].join('\n');
const discipline = (over = {}) => auditPlanDiscipline({
  cards: [],
  weeklyText: planFor('2026-W39', ['- [ ] **計測** — `AAA-01`']),
  reviews: [REVIEW_MISS('2026-W38'), REVIEW_MISS('2026-W37')],
  today: '2026-09-27',
  files: { backlog: 'b', weekly: 'w' },
  ...over,
});

test('未達 Must の ID はレビュー表の「| Must … 未達」行からだけ取る', () => {
  assert.deepStrictEqual(parseUnmetMustIds(REVIEW_MISS('W').text), ['AAA-01']);
  assert.strictEqual(summarizeReviews([REVIEW_MISS('2026-W38'), { week: '2026-W37', text: 'Must 3/3' }]).missStreak, 1);
});

test('2 週連続未達で前週の未達 Must を主 ID のまま再掲すると DG082 error、[分割] か別 ID が主なら通す', () => {
  assert.match(discipline().issues.map((i) => `${i.code}:${i.message}`).join(), /DG082:.*AAA-01/);
  assert.deepStrictEqual(discipline({ weeklyText: planFor('2026-W39', ['- [ ] **計測を 2 URL だけ** [分割] [S] — `AAA-01`']) }).repeated, []);
  // 別施策の作業の中で前週未達の ID に触れただけなら再掲ではない (2026-W39 の実例)
  assert.deepStrictEqual(discipline({ weeklyText: planFor('2026-W39', ['- [ ] **経路を閉じる** — `CCC-01`。あわせて `AAA-01` の確定値を取る']) }).repeated, []);
});

test('連続未達が 1 週なら、レビューより前の週の計画なら DG082 を出さない', () => {
  assert.deepStrictEqual(discipline({ reviews: [REVIEW_MISS('2026-W38'), { week: '2026-W37', text: 'Must 2/2' }] }).repeated, []);
  assert.deepStrictEqual(discipline({ weeklyText: planFor('2026-W38', ['- [ ] **計測** — `AAA-01`']) }).repeated, []);
});

test('🔴 は上限超過と起票から一定日数を過ぎた未着手を DG081 warning、上限ちょうど・着手中は出さない', () => {
  const card = (i, filed = '2026-09-20', wip = false) => ({ id: `H-${i}`, tier: 'high', filed, wip });
  const at = Array.from({ length: MAX_HIGH_TIER_CARDS }, (_, i) => card(i));
  const codesOf = (cards) => discipline({ cards, reviews: [] }).issues.filter((i) => i.code === 'DG081').map((i) => i.message);
  assert.deepStrictEqual(codesOf(at), []);
  assert.match(codesOf([...at, card('x')]).join(), /上限 \d+ 枚を超えている/);
  const old = new Date(Date.parse('2026-09-27T00:00:00Z') - (HIGH_TIER_MAX_AGE_DAYS + 1) * 86400000).toISOString().slice(0, 10);
  assert.match(codesOf([card('old', old)]).join(), /H-old/);
  assert.deepStrictEqual(codesOf([card('wip', old, true)]), []);
});

// ── 週次 Must と 🔴 の着手順 (DG083)。意図: 月次で 🔴 を並べ替えても、週の Must が別作業で埋まれば進まない。
test('Must が 🔴 上位 (オーナー作業を除く) をどれも参照しないと DG083、1 枚でも入っていれば出さない', () => {
  const high = (id, executor = '対話', kind = '改善') => ({ id, tier: 'high', executor, kind, filed: '2026-09-20' });
  const cards = [high('OWN-01', 'ユーザー'), high('TOP-01'), high('TOP-02'), high('TOP-03'), high('FOURTH-01'), { id: 'BUG-01', tier: 'mid', kind: '不具合' }];
  const audit = (must) => auditPlanDiscipline({
    cards,
    weeklyText: planFor('2026-W40', must),
    reviews: [],
    today: '2026-09-27',
    files: { backlog: 'b', weekly: 'w' },
  });
  const other = audit(['- [ ] **別作業** — `FOURTH-01`']);
  assert.match(other.issues.map((i) => `${i.code}:${i.message}`).join(), /DG083:.*TOP-01, TOP-02, TOP-03/);
  // オーナー作業は上位に数えない (Must ではなくオーナー作業として出す)
  assert.deepStrictEqual(other.topHigh, ['TOP-01', 'TOP-02', 'TOP-03']);
  assert.deepStrictEqual(other.ownerHigh, ['OWN-01']);
  assert.deepStrictEqual(audit(['- [ ] **上位の 3 番目** — `TOP-03`']).issues.filter((i) => i.code === 'DG083'), []);
  // 損失の出ている不具合を Must に入れた週は、重点外でも許す
  assert.deepStrictEqual(audit(['- [ ] **不具合** — `BUG-01`']).issues.filter((i) => i.code === 'DG083'), []);
});
