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
