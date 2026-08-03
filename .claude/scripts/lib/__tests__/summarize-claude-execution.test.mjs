import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatSummary,
  redact,
  summarizeClaudeExecution,
} from '../summarize-claude-execution.mjs';

// 2026-08-02 に実際に出た形 (ai-content run 30762722415 / blog run 30765658357)。
// init は成功し turn 1 で is_error、cost 0、tool は 1 度も呼ばれない。
const EARLY_FAILURE = [
  { type: 'system', subtype: 'init', message: 'Claude Code initialized', model: 'claude-sonnet-5' },
  {
    type: 'result',
    subtype: 'success',
    is_error: true,
    duration_ms: 2306,
    num_turns: 1,
    total_cost_usd: 0,
    permission_denials_count: 0,
  },
];

test('早期失敗を「起動・認証・上限の側」と切り分けられる', () => {
  const summary = summarizeClaudeExecution(EARLY_FAILURE);
  assert.equal(summary.found, true);
  assert.equal(summary.isError, true);
  assert.equal(summary.numTurns, 1);
  assert.equal(summary.toolUseCount, 0);
  const text = formatSummary(summary);
  assert.match(text, /tool を 1 度も呼べていない/);
  // エラー文が無いことを黙って伏せない
  assert.match(text, /show_full_output/);
});

test('result の error 文字列を拾う', () => {
  const summary = summarizeClaudeExecution([
    { type: 'result', subtype: 'error', is_error: true, num_turns: 1, error: 'OAuth token expired' },
  ]);
  assert.equal(summary.errorText, 'OAuth token expired');
  assert.match(formatSummary(summary), /OAuth token expired/);
});

test('早期失敗のときだけ assistant 本文を覗く', () => {
  const withText = (numTurns) => [
    {
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'API Error: usage limit reached' }] },
    },
    { type: 'result', subtype: 'success', is_error: true, num_turns: numTurns },
  ];
  assert.match(summarizeClaudeExecution(withText(1)).earlyAssistantText, /usage limit/);
  // 生成が進んだ後の本文は出さない (記事本文・観測値が混ざるため)
  assert.equal(summarizeClaudeExecution(withText(30)).earlyAssistantText, '');
});

test('成功 run では早期本文を出さない', () => {
  const summary = summarizeClaudeExecution([
    { type: 'assistant', message: { content: [{ type: 'text', text: '記事本文' }] } },
    { type: 'result', subtype: 'success', is_error: false, num_turns: 1 },
  ]);
  assert.equal(summary.earlyAssistantText, '');
});

test('tool_use と subagent_type を数える', () => {
  const summary = summarizeClaudeExecution([
    {
      type: 'assistant',
      message: {
        content: [
          { type: 'tool_use', name: 'Agent', input: { subagent_type: 'ranking-content-author' } },
          { type: 'tool_use', name: 'Agent', input: { subagent_type: 'ranking-content-critic' } },
          { type: 'tool_use', name: 'Read', input: {} },
        ],
      },
    },
    { type: 'result', subtype: 'success', is_error: false, num_turns: 12 },
  ]);
  assert.equal(summary.toolUseCount, 3);
  assert.deepEqual(summary.agentTypes, ['ranking-content-author', 'ranking-content-critic']);
  // tool を呼べているので「起動側の問題」とは言わない
  assert.doesNotMatch(formatSummary(summary), /tool を 1 度も呼べていない/);
});

test('result entry が無い場合を明示する', () => {
  const text = formatSummary(summarizeClaudeExecution([{ type: 'system', subtype: 'init' }]));
  assert.match(text, /result entry が無い/);
});

test('壊れた入力でも throw しない (診断が本体の失敗を隠さない)', () => {
  for (const input of [null, undefined, 'x', 42, [], [null, 1, 'a']]) {
    assert.doesNotThrow(() => formatSummary(summarizeClaudeExecution(input)));
  }
});

test('秘匿値を伏せる', () => {
  assert.match(redact('token: sk-abcdefgh12345678'), /\[REDACTED\]/);
  assert.match(redact('use github_pat_11ABCDEFG0123456789'), /\[REDACTED\]/);
  assert.match(redact('"authorization": "Bearer xyz"'), /\[REDACTED\]/);
  // 40 文字以上の連続 token 様文字列
  assert.match(redact(`x ${'a'.repeat(48)} y`), /\[REDACTED\]/);
  // 普通の文は壊さない
  assert.equal(redact('OAuth token expired'), 'OAuth token expired');
});

test('長文は truncate する', () => {
  const summary = summarizeClaudeExecution([
    { type: 'result', is_error: true, num_turns: 1, error: 'あ'.repeat(2000) },
  ]);
  assert.ok(summary.errorText.length < 800);
  assert.match(summary.errorText, /文字省略/);
});

test('成功 run に「エラー文が無い」という但し書きを出さない', () => {
  const out = formatSummary(
    summarizeClaudeExecution([
      { type: 'result', subtype: 'success', is_error: false, num_turns: 41, duration_ms: 1, total_cost_usd: 2.8 },
    ]),
  );
  assert.doesNotMatch(out, /show_full_output/, '正常な run を異常のように見せている');

  // 失敗 run では従来どおり出す (助言を消してしまっていないこと)
  const failed = formatSummary(
    summarizeClaudeExecution([{ type: 'result', subtype: 'error', is_error: true, num_turns: 1 }]),
  );
  assert.match(failed, /show_full_output/);
});
