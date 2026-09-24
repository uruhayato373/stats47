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
  const log = evaluateRun({ ...base, changedFiles: ['.claude/skills/analytics/ga4-improvement/reference/improvement-log.md'], afterImprovements: base.beforeImprovements });
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
    '+++ b/.claude/skills/analytics/ga4-improvement/reference/improvement-log.md',
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
