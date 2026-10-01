import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { summarizeClaudeExecution } from '../summarize-claude-execution.mjs';
import {
  CSV_HEADER,
  appendUsageRow,
  buildUsageRow,
  formatCsvLine,
  hasRunId,
} from '../record-claude-usage.mjs';

const resultEntry = (over = {}) => ({
  type: 'result',
  subtype: 'success',
  is_error: false,
  num_turns: 12,
  duration_ms: 569_000,
  total_cost_usd: 1.23,
  usage: {
    input_tokens: 40,
    output_tokens: 18_000,
    cache_creation_input_tokens: 250_000,
    cache_read_input_tokens: 3_400_000,
  },
  ...over,
});

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'claude-usage-'));

test('result entry の usage をそのまま拾う', () => {
  const s = summarizeClaudeExecution([resultEntry()]);
  assert.deepEqual(s.tokens, {
    input: 40,
    output: 18_000,
    cacheWrite: 250_000,
    cacheRead: 3_400_000,
    source: 'result',
  });
});

test('result に usage が無ければ assistant メッセージを合算する', () => {
  const s = summarizeClaudeExecution([
    { type: 'assistant', message: { usage: { input_tokens: 5, output_tokens: 100 } } },
    { type: 'assistant', message: { usage: { input_tokens: 7, cache_read_input_tokens: 900 } } },
    resultEntry({ usage: undefined }),
  ]);
  assert.equal(s.tokens.source, 'messages');
  assert.equal(s.tokens.input, 12);
  assert.equal(s.tokens.output, 100);
  assert.equal(s.tokens.cacheRead, 900);
});

test('usage の記録が無いときは 0 と区別できる', () => {
  const s = summarizeClaudeExecution([resultEntry({ usage: undefined })]);
  assert.equal(s.tokens.source, null, '未取得を source=null で示す');
  assert.equal(s.tokens.output, 0);
  // 「0 トークン」と「測れていない」を同じ表示にしない
  assert.equal(buildUsageRow({ summary: s, date: '2026-08-03', workflow: 'w' }).token_source, 'none');
});

test('cacheRead を他と合算しない (桁が壊れるため)', () => {
  const s = summarizeClaudeExecution([resultEntry()]);
  const row = buildUsageRow({ summary: s, date: '2026-08-03', workflow: 'blog', runId: 1, limit: 3, items: 3 });
  assert.equal(row.cache_read, 3_400_000);
  assert.equal(row.output, 18_000);
  assert.ok(!('total' in row), '合計列を作らない');
});

test('壊れた usage 値を数値として持ち込まない', () => {
  const s = summarizeClaudeExecution([
    resultEntry({ usage: { input_tokens: -5, output_tokens: 'x', cache_read_input_tokens: NaN } }),
  ]);
  assert.equal(s.tokens.input, 0);
  assert.equal(s.tokens.output, 0);
  assert.equal(s.tokens.cacheRead, 0);
});

test('CSV の列順がヘッダと一致する', () => {
  const s = summarizeClaudeExecution([resultEntry()]);
  const row = buildUsageRow({ summary: s, date: '2026-08-03', workflow: 'blog', runId: 42, limit: 3, items: 3 });
  const cells = formatCsvLine(row).split(',');
  assert.equal(cells.length, CSV_HEADER.split(',').length);
  assert.equal(cells[CSV_HEADER.split(',').indexOf('run_id')], '42');
  assert.equal(cells[CSV_HEADER.split(',').indexOf('items')], '3');
});

test('同じ run_id は二重に記録しない', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'history.csv');
    const s = summarizeClaudeExecution([resultEntry()]);
    const row = buildUsageRow({ summary: s, date: '2026-08-03', workflow: 'blog', runId: 7, limit: 3, items: 3 });
    assert.equal(appendUsageRow(file, row).appended, true);
    assert.equal(appendUsageRow(file, row).appended, false, '再実行で二重計上しない');
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    assert.equal(lines.length, 2, 'ヘッダ + 1 行');
    assert.equal(lines[0], CSV_HEADER);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('append は既存行を書き換えない', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'history.csv');
    const s = summarizeClaudeExecution([resultEntry()]);
    for (const runId of [1, 2, 3]) {
      appendUsageRow(file, buildUsageRow({ summary: s, date: '2026-08-03', workflow: 'blog', runId }));
    }
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    assert.equal(lines.length, 4);
    assert.ok(hasRunId(fs.readFileSync(file, 'utf8'), 2));
    assert.ok(!hasRunId(fs.readFileSync(file, 'utf8'), 99));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('init 行の model と --effort を記録する (モデル・effort 変更の前後比較のため)', () => {
  const s = summarizeClaudeExecution([
    { type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' },
    resultEntry({ modelUsage: { 'claude-sonnet-5-5': {}, 'claude-haiku-4-5': {} } }),
  ]);
  assert.equal(s.model, 'claude-sonnet-5-5');
  assert.deepEqual(s.modelUsage, ['claude-haiku-4-5', 'claude-sonnet-5-5']);
  const row = buildUsageRow({ summary: s, date: '2026-10-02', workflow: 'w', runId: 1, effort: 'high' });
  const cells = formatCsvLine(row).split(',');
  assert.equal(cells[CSV_HEADER.split(',').indexOf('model')], 'claude-sonnet-5-5');
  assert.equal(cells[CSV_HEADER.split(',').indexOf('effort')], 'high');
});

test('init 行が無ければ model は空 (推測で埋めない)', () => {
  const row = buildUsageRow({ summary: summarizeClaudeExecution([resultEntry()]), date: '2026-10-02', workflow: 'w' });
  assert.equal(row.model, '');
  assert.equal(row.effort, '');
});

test('列を足す前のヘッダはヘッダ行だけ新しくし、既存データ行は書き換えない', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'history.csv');
    const oldHeader = CSV_HEADER.split(',').slice(0, -2).join(',');
    const oldRow = '2026-08-03,blog,1,1,1,36,1,1.5,1,2,3,4,result,0';
    fs.writeFileSync(file, `${oldHeader}\n${oldRow}\n`);
    const s = summarizeClaudeExecution([resultEntry()]);
    assert.equal(appendUsageRow(file, buildUsageRow({ summary: s, date: '2026-10-02', workflow: 'w', runId: 2, effort: 'medium' })).appended, true);
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    assert.equal(lines[0], CSV_HEADER);
    assert.equal(lines[1], oldRow, '既存行はそのまま');
    assert.equal(lines[2].split(',').at(-1), 'medium');
    assert.equal(appendUsageRow(file, buildUsageRow({ summary: s, date: '2026-10-02', workflow: 'w', runId: 1 })).appended, false, '旧行の run_id も重複判定に効く');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CI 記録スクリプトは job のブランチと作業ツリーに触れず、記録の commit だけを develop へ push する', async () => {
  const { execFileSync } = await import('node:child_process');
  const dir = tmp();
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).trim();
  try {
    const origin = path.join(dir, 'origin.git');
    const work = path.join(dir, 'work');
    git(dir, 'init', '-q', '--bare', origin);
    git(dir, 'clone', '-q', origin, work);
    git(work, 'checkout', '-q', '-b', 'develop');
    const lib = path.join(work, '.claude/scripts/lib');
    fs.mkdirSync(lib, { recursive: true });
    for (const f of ['record-claude-usage.mjs', 'summarize-claude-execution.mjs', 'record-claude-usage-ci.sh']) {
      fs.copyFileSync(path.join(import.meta.dirname, '..', f), path.join(lib, f));
    }
    git(work, 'add', '.claude/scripts/lib');
    git(work, 'commit', '-qm', 'init');
    git(work, 'push', '-q', 'origin', 'develop');
    // job が PR 用ブランチへ切り替え、未 push の commit と未追跡ファイルを持っている状態
    git(work, 'checkout', '-q', '-b', 'feature-pr');
    fs.writeFileSync(path.join(work, 'pr.txt'), 'pr');
    git(work, 'add', 'pr.txt');
    git(work, 'commit', '-qm', 'pr commit');
    fs.writeFileSync(path.join(work, 'wip.txt'), 'wip');
    const exec = path.join(dir, 'exec.json');
    fs.writeFileSync(exec, JSON.stringify([{ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' }, resultEntry()]));

    execFileSync('bash', ['.claude/scripts/lib/record-claude-usage-ci.sh', exec, 'demo', '1', '1', 'high'], { cwd: work, env: { ...process.env, GITHUB_RUN_ID: '555' }, encoding: 'utf8' });

    assert.equal(git(work, 'branch', '--show-current'), 'feature-pr', 'job のブランチはそのまま');
    assert.ok(fs.existsSync(path.join(work, 'wip.txt')), '未追跡ファイルを stash に置き去りにしない');
    const log = git(work, '--git-dir', origin, 'log', '--format=%s', 'develop').split('\n');
    assert.deepEqual(log, ['chore(metrics): record Claude token usage [skip ci]', 'init'], 'PR 用の commit を develop へ流さない');
    const csv = git(work, '--git-dir', origin, 'show', 'develop:.claude/state/metrics/claude-usage/history.csv');
    assert.match(csv.split('\n')[1], /,555,.*,claude-sonnet-5-5,high$/);
    assert.equal(git(work, 'worktree', 'list').split('\n').length, 1, '記録用 worktree を片付ける');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
