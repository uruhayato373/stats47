import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateRun, findSecretLeaks, MAX_NEW_BACKLOG_CARDS, parseImprovementRows } from '../lib/improvement-cycle-gate.mjs';

const table = (rows) => ['| ID | タイトル | Status | Due | Owner | Metric |', '|---|---|---|---|---|---|', ...rows].join('\n');
const base = {
  changedFiles: ['.claude/todo/improvements.md'],
  beforeImprovements: table(['| AAA-01 | t | effect/pending | 2026-09-21 | claude | ga4 |', '| BBB-01 | t | pending | 2026-09-21 | claude | gsc |']),
  beforeBacklog: '### [CARD-01] a\n### [CARD-02] b\n',
  afterBacklog: '### [CARD-01] a\n### [CARD-02] b\n',
};

test('a normal triage run (one row closed, one updated) passes and is summarized', () => {
  const result = evaluateRun({ ...base, afterImprovements: table(['| AAA-01 | t 追記 | effect/pending | 2026-10-08 | claude | ga4 |']) });
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.improvements, { deleted: ['BBB-01'], added: [], updated: ['AAA-01'] });
});

test('mentioning effect/full in the title is allowed; setting it in the Status column is not', () => {
  // 2026-09-24 の手動 triage は本文に「effect/full・effect/partialは付けない」と書いた。文字列 grep だと誤検知する
  const mention = evaluateRun({ ...base, afterImprovements: table(['| AAA-01 | effect/full・effect/partialは付けない | effect/pending | 2026-10-08 | claude | ga4 |']) });
  assert.deepEqual(mention.problems, []);
  const label = evaluateRun({ ...base, afterImprovements: table(['| AAA-01 | t | effect/full | 2026-10-08 | claude | ga4 |']) });
  assert.equal(label.problems.length, 1);
  assert.match(label.problems[0], /AAA-01: Status に effect\/full/);
  // effect/none も candidate 抑制台帳を動かす確定判定なので、無人 run では付けさせない
  const none = evaluateRun({ ...base, afterImprovements: table(['| AAA-01 | t | effect/none | 2026-10-08 | claude | ga4 |']) });
  assert.match(none.problems[0], /effect\/none/);
});

test('files outside the triage scope are rejected', () => {
  const result = evaluateRun({ ...base, changedFiles: ['.claude/todo/improvements.md', 'apps/web/src/app/page.tsx'], afterImprovements: base.beforeImprovements });
  assert.deepEqual(result.problems, ['許可外のファイルを変更: apps/web/src/app/page.tsx']);
  const log = evaluateRun({ ...base, changedFiles: ['data/improvement/ga4-improvement/improvement-log.md'], afterImprovements: base.beforeImprovements });
  assert.deepEqual(log.problems, []);
});

test('backlog cards may be added up to the cap but never removed', () => {
  const removed = evaluateRun({ ...base, afterImprovements: base.beforeImprovements, afterBacklog: '### [CARD-01] a\n' });
  assert.match(removed.problems[0], /CARD-02/);
  const many = Array.from({ length: MAX_NEW_BACKLOG_CARDS + 1 }, (_, i) => `### [NEW-0${i}] n`).join('\n');
  const flood = evaluateRun({ ...base, afterImprovements: base.beforeImprovements, afterBacklog: `${base.beforeBacklog}${many}\n` });
  assert.match(flood.problems[0], /上限/);
});

test('a service account key written into an allowed log blocks the push', () => {
  // run は GA4 の鍵を env に持ち、結果は公開 repo へ push される。改善ログは許可パスなので形で止める
  const diffText = [
    '+++ b/data/improvement/ga4-improvement/improvement-log.md',
    '+- 実測: blog→ranking 7.6%',
    '+"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIE"',
  ].join('\n');
  const result = evaluateRun({ ...base, afterImprovements: base.beforeImprovements, diffText });
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /秘密情報/);
  assert.deepEqual(findSecretLeaks('+- 実測: CTR 0.147%\n-"private_key": "old"'), []);
});

test('row parser ignores the header and non-ID rows', () => {
  assert.deepEqual([...parseImprovementRows(base.beforeImprovements).keys()], ['AAA-01', 'BBB-01']);
});

// 登録時の KPI 配線。意図: 無人 run が「どの KPI を動かすか・どこまで動けば成功か」を言えない施策を台帳へ入れない。
const KPI_IDS = ['search-clicks', 'affiliate-yield'];

test('a new row needs a known [kpi:] and a [target:]; with both it passes', () => {
  const add = (title) => evaluateRun({
    ...base,
    kpiIds: KPI_IDS,
    afterImprovements: table(['| AAA-01 | t | effect/pending | 2026-09-21 | claude | ga4 |', '| BBB-01 | t | pending | 2026-09-21 | claude | gsc |', `| NEW-01 | ${title} | pending | 2026-10-20 | claude | gsc |`]),
  }).problems;
  assert.deepEqual(add('新施策 [kpi: search-clicks] [target: +200 clicks/28日]'), []);
  assert.match(add('新施策 [target: +200 clicks/28日]').join(), /NEW-01: 新しい施策に KPI ツリーの \[kpi: <id>\] が無い/);
  assert.match(add('新施策 [kpi: pageviews] [target: +1]').join(), /NEW-01: .*pageviews/);
  assert.match(add('新施策 [kpi: search-clicks]').join(), /NEW-01: 新しい施策に \[target:\] が無い/);
});

test('existing rows without markers are not blocked, but dropping a marker is', () => {
  // 既存行の目印は docs:check (DG079) が見る。ゲートは今回の run が壊したものだけを止める
  const before = table(['| AAA-01 | t [kpi: search-clicks] | pending | 2026-09-21 | claude | gsc |', '| BBB-01 | t | pending | 2026-09-21 | claude | gsc |']);
  const run = (rows) => evaluateRun({ ...base, beforeImprovements: before, kpiIds: KPI_IDS, afterImprovements: table(rows) }).problems;
  assert.deepEqual(run(['| AAA-01 | t 更新 [kpi: search-clicks] | pending | 2026-09-21 | claude | gsc |', '| BBB-01 | t 更新 | pending | 2026-09-21 | claude | gsc |']), []);
  assert.match(run(['| AAA-01 | t 更新 | pending | 2026-09-21 | claude | gsc |', '| BBB-01 | t | pending | 2026-09-21 | claude | gsc |']).join(), /AAA-01: \[kpi:\] を消した/);
});

test('adding a row while over the active cap is rejected; updates over the cap are not', () => {
  const rows = ['| AAA-01 | t | effect/pending | 2026-09-21 | claude | ga4 |', '| BBB-01 | t | pending | 2026-09-21 | claude | gsc |'];
  const added = evaluateRun({ ...base, kpiIds: KPI_IDS, maxActive: 2, afterImprovements: table([...rows, '| NEW-01 | n [kpi: search-clicks] [target: +1] | pending | 2026-10-20 | claude | gsc |']) });
  assert.match(added.problems.join(), /上限 2 件を超えたまま新しい施策を 1 件足した/);
  const updated = evaluateRun({ ...base, kpiIds: KPI_IDS, maxActive: 1, afterImprovements: table(['| AAA-01 | t 追記 | effect/pending | 2026-10-08 | claude | ga4 |', rows[1]]) });
  assert.deepEqual(updated.problems, []);
});
