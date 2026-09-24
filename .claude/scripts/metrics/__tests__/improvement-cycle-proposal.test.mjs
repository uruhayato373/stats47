import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateRun } from '../lib/improvement-cycle-gate.mjs';
import { applyProposal, MAX_PROPOSAL_ITEMS } from '../lib/improvement-cycle-proposal.mjs';

const WEEK = '2026-W39';
const improvements = [
  '# 改善バックログ',
  '',
  '| ID | タイトル | Status | Due | Owner | Metric |',
  '|---|---|---|---|---|---|',
  '| AAA-01 | 旧タイトル | pending | 2026-09-21 | claude | ga4 |',
  '| BBB-01 | 閉じる施策 | effect/pending | 2026-09-21 | claude | gsc |',
  '',
  '## 実行手順',
  '',
  '### `BBB-01`',
  '',
  '- 手順本文',
  '',
  '### `CCC-01`',
  '',
  '- 残る手順',
].join('\n');
const backlog = ['# バックログ', '', '## 🔴 高', '', '### [OLD-01] 既存', '', 'タグ: [x]', '', '## 🟡 中', ''].join('\n');
const files = { improvements, backlog, logs: { 'ga4-improvement': '# log\n\n## 既存\n' } };
const updateRow = '| AAA-01 | 新タイトル | pending | 2026-10-08 | claude | ga4 |';
const closeLog = { skill: 'ga4-improvement', markdown: '### [BBB-01] 判定 (2026-09-28)\n- 根拠: 実測' };

test('a valid proposal updates, deletes with its procedure section, appends the log and inserts a card', () => {
  const card = { tier: '🟡', markdown: '### [NEW-01] 新しい作業\nタグ: [種類:改善] [実行:対話]\n\n- 次: 確認する' };
  const out = applyProposal(files, {
    week: WEEK,
    improvements: [{ id: 'AAA-01', action: 'update', row: updateRow }, { id: 'BBB-01', action: 'delete' }],
    logEntries: [closeLog],
    backlogCards: [card],
  }, { week: WEEK });
  assert.deepEqual(out.problems, []);
  assert.ok(out.improvements.includes(updateRow));
  assert.ok(!out.improvements.includes('BBB-01'), 'row and `### `BBB-01`` section are both removed');
  assert.ok(out.improvements.includes('### `CCC-01`\n\n- 残る手順'), 'the next procedure section is kept');
  assert.ok(out.logs['ga4-improvement'].endsWith('## 既存\n\n### [BBB-01] 判定 (2026-09-28)\n- 根拠: 実測\n'));
  assert.match(out.backlog, /## 🟡 中\n\n### \[NEW-01\] 新しい作業\nタグ:/);
  assert.deepEqual(out.summary, { updated: ['AAA-01'], deleted: ['BBB-01'], logs: ['ga4-improvement'], cards: ['NEW-01'] });
});

test('an empty proposal is valid: "nothing to change" is a decision, a missing file is not', () => {
  const out = applyProposal(files, { week: WEEK, improvements: [], logEntries: [], backlogCards: [] }, { week: WEEK });
  assert.deepEqual(out.problems, []);
  assert.equal(out.improvements, improvements);
});

test('any violation leaves every file untouched (no partial apply)', () => {
  const out = applyProposal(files, {
    week: WEEK,
    improvements: [{ id: 'AAA-01', action: 'update', row: updateRow }, { id: 'ZZZ-01', action: 'update', row: '| ZZZ-01 | t | pending | x | y | z |' }],
  }, { week: WEEK });
  assert.equal(out.problems.length, 1);
  assert.match(out.problems[0], /ZZZ-01.*improvements\.md に無い ID/);
  assert.equal(out.improvements, improvements);
  assert.deepEqual(out.logs, {});
});

test('shapes the model must not produce are rejected with a reason', () => {
  const run = (proposal) => applyProposal(files, { week: WEEK, ...proposal }, { week: WEEK }).problems;
  // 削除は根拠ログとセット (evidence-based-judgment: 判定・根拠・再現コマンドを残す)
  assert.match(run({ improvements: [{ id: 'BBB-01', action: 'delete' }] })[0], /logEntries/);
  // 行の ID を差し替える・列数を崩す・複数行にする
  assert.match(run({ improvements: [{ id: 'AAA-01', action: 'update', row: updateRow.replace('AAA-01', 'BBB-01') }] })[0], /6 列 1 行/);
  assert.match(run({ improvements: [{ id: 'AAA-01', action: 'update', row: '| AAA-01 | t | pending |' }] })[0], /6 列 1 行/);
  assert.match(run({ improvements: [{ id: 'AAA-01', action: 'update', row: `${updateRow}\n${updateRow}` }] })[0], /6 列 1 行/);
  assert.match(run({ improvements: [{ id: 'AAA-01', action: 'rewrite' }] })[0], /update \/ delete/);
  // 存在しない skill へのログ・既存 ID のカード・タグ行の無いカード・上限超過・別週
  assert.match(run({ logEntries: [{ skill: 'seo-improvement', markdown: 'x' }] })[0], /seo-improvement/);
  assert.match(run({ backlogCards: [{ tier: '🔴', markdown: '### [OLD-01] 重複\nタグ: [x]' }] })[0], /既にある/);
  assert.match(run({ backlogCards: [{ tier: '🔴', markdown: '### [NEW-02] タグ無し\n\n本文' }] })[0], /タグ:/);
  assert.match(run({ backlogCards: [{ tier: '⚪', markdown: '### [NEW-03] t\nタグ: [x]' }] })[0], /tier/);
  const many = Array.from({ length: MAX_PROPOSAL_ITEMS + 1 }, () => ({ id: 'AAA-01', action: 'update', row: updateRow }));
  assert.ok(run({ improvements: many }).some((p) => /上限/.test(p)));
  assert.match(applyProposal(files, { week: '2026-W38' }, { week: WEEK }).problems[0], /week/);
  assert.match(applyProposal(files, [], { week: WEEK }).problems[0], /JSON オブジェクト/);
});

test('a write denied by permissions fails the gate even when the diff is empty', () => {
  // 2026-09-24 run 35996605022: Edit が 3 回拒否されたのに「変更 0 件・gate pass」で通った
  const input = { changedFiles: [], beforeImprovements: improvements, afterImprovements: improvements, beforeBacklog: backlog, afterBacklog: backlog };
  const denials = [
    { tool: 'Edit', target: '/home/runner/work/stats47/stats47/.claude/todo/improvements.md' },
    { tool: 'Edit', target: '/home/runner/work/stats47/stats47/.claude/todo/improvements.md' },
    { tool: 'Bash', target: 'find .claude/state -name x' },
  ];
  const result = evaluateRun({ ...input, denials });
  assert.deepEqual(result.problems, ['ファイル書き込みが権限で拒否された: Edit → /home/runner/work/stats47/stats47/.claude/todo/improvements.md']);
  // 読み取り系コマンドの拒否は探索の失敗であって記録の失敗ではない
  assert.deepEqual(evaluateRun({ ...input, denials: [denials[2]] }).problems, []);
});
