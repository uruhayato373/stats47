import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReport, summarizeCi } from '../build-model-usage-report.mjs';
import { fixtureCases, judge, rescore, scoreOutput } from '../run-canary.mjs';
import {
  costOf,
  isoWeek,
  markRun,
  mergeRows,
  mergeWeeks,
  proposeChanges,
  rowsFromTranscript,
  tokensOf,
} from '../usage-core.mjs';

/**
 * モデル使用量の計測→記録→改善サイクル。
 * ★なぜこの性質を固定するか
 *   - 同じ API 応答は content block ごとに複数行へ分かれ、各行に同じ usage が付く。重複を数えると費用が数倍になる
 *     (実測: 約 1.9 万行が重複行だった)。
 *   - 提案は閾値を跨いだときだけ出て、canary が不合格なら「据え置き」になる。閾値を動かすと判定が変わることも見る。
 */

const pricing = {
  models: {
    'claude-opus-5-5': { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2, output: 20 },
    'claude-sonnet-5-5': { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, output: 10 },
    'claude-sonnet-5': { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, output: 10 },
  },
};

const policy = {
  windowWeeks: 4,
  minRuns: 3,
  minCostUsd: 20,
  heavyEfforts: ['xhigh', 'max'],
  heavyEffortShare: 0.5,
  defaultEffortSuggestion: 'high',
  minSavingUsd: 5,
  downgradeTarget: { opus: 'claude-sonnet-5-5' },
  driftShare: 0.5,
  latestModels: { sonnet: 'claude-sonnet-5-5', opus: 'claude-opus-5-5' },
};

const line = (o) => JSON.stringify({ type: 'assistant', timestamp: '2026-09-30T00:00:00Z', effort: 'xhigh', ...o });

test('同じ message.id の行は 1 回だけ数え、<synthetic> は数えない', () => {
  const usage = { input_tokens: 10, output_tokens: 100, cache_read_input_tokens: 1000 };
  const rows = rowsFromTranscript(
    [
      line({ message: { id: 'm1', model: 'claude-opus-5-5', usage } }),
      line({ message: { id: 'm1', model: 'claude-opus-5-5', usage } }),
      line({ message: { id: 'm2', model: '<synthetic>', usage } }),
      JSON.stringify({ type: 'user' }),
      'not json',
    ],
    { scope: 'sub', agentType: 'x' },
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tokens.output, 100);
});

test('費用は 4 種のトークンを別単価で換算し、単価の無いモデルは null (0 と区別)', () => {
  const t = { input: 1e6, output: 1e6, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 1e6 };
  assert.equal(costOf(t, 'claude-opus-5-5', pricing), 4 + 20 + 0.2);
  assert.equal(costOf(t, 'claude-unknown-9', pricing), null);
  assert.equal(costOf(t, 'claude-opus-5-5-20261001', pricing), 24.2, '日付付き ID も単価表に寄せる');
});

test('cache_creation の内訳が無い古い記録は 5 分キャッシュとして数える (節約額を過大にしない)', () => {
  assert.deepEqual(tokensOf({ cache_creation_input_tokens: 50 }), { input: 0, output: 0, cacheWrite5m: 50, cacheWrite1h: 0, cacheRead: 0 });
  assert.equal(tokensOf({ cache_creation: { ephemeral_1h_input_tokens: 7 }, cache_creation_input_tokens: 7 }).cacheWrite1h, 7);
});

test('ISO 週は年またぎを正しく扱う', () => {
  assert.equal(isoWeek('2026-01-01T00:00:00Z'), '2026-W01');
  assert.equal(isoWeek('2027-01-01T00:00:00Z'), '2026-W53');
  assert.equal(isoWeek('nope'), null);
});

test('runs は transcript 1 本につき 1 回だけ数える', () => {
  const usage = { output_tokens: 1 };
  const rows = markRun(
    rowsFromTranscript(
      [line({ message: { id: 'a', model: 'claude-opus-5-5', usage } }), line({ message: { id: 'b', model: 'claude-opus-5-5', usage }, effort: 'high' })],
      { scope: 'sub', agentType: 'x' },
    ),
  );
  const merged = mergeRows(rows, pricing);
  assert.equal(merged.reduce((n, r) => n + r.runs, 0), 1);
  assert.equal(merged.reduce((n, r) => n + r.calls, 0), 2);
});

test('今回見えた週だけ置き換え、transcript が消えた古い週は残す', () => {
  const prev = [{ week: '2026-W30', scope: 'sub', agentType: 'a', model: 'm', effort: 'x', calls: 5 }, { week: '2026-W40', scope: 'sub', agentType: 'a', model: 'm', effort: 'x', calls: 1 }];
  const scanned = [{ week: '2026-W40', scope: 'sub', agentType: 'a', model: 'm', effort: 'x', calls: 9 }];
  const merged = mergeWeeks(prev, scanned);
  assert.deepEqual(merged.map((r) => [r.week, r.calls]), [['2026-W30', 5], ['2026-W40', 9]]);
});

const subRow = (o) => ({ week: '2026-W40', scope: 'sub', agentType: 'reviewer', model: 'claude-opus-5-5', effort: 'xhigh', runs: 1, calls: 10, tokens: { input: 0, output: 1e6, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 }, costUsd: 20, ...o });

test('effort 未指定で重い effort を継承している agent に effort を提案し、閾値未満なら出さない', () => {
  const rows = [subRow({ runs: 3, model: 'claude-sonnet-5-5', costUsd: 10 })];
  const agents = [{ name: 'reviewer', model: 'sonnet', effort: null }];
  const p = proposeChanges({ agents, rows, pricing, policy });
  assert.deepEqual(p.map((x) => x.kind), ['set-effort']);
  assert.equal(p[0].canary, 'not-run');
  // effort を書いた agent には出さない
  assert.equal(proposeChanges({ agents: [{ ...agents[0], effort: 'high' }], rows, pricing, policy }).length, 0);
  // mutation: 重い effort の割合の閾値を上げると出なくなる
  assert.equal(proposeChanges({ agents, rows, pricing, policy: { ...policy, heavyEffortShare: 1.01 } }).length, 0);
  // 回数も費用も足りなければ出さない
  assert.equal(proposeChanges({ agents, rows: [subRow({ runs: 1, model: 'claude-sonnet-5-5', costUsd: 1 })], pricing, policy }).length, 0);
});

test('opus で動く agent に sonnet 換算の節約見込みを付け、canary の結果で次の一手が変わる', () => {
  const rows = [subRow({ runs: 3, effort: 'high' })];
  const agents = [{ name: 'reviewer', model: 'opus', effort: 'high' }];
  const [p] = proposeChanges({ agents, rows, pricing, policy });
  assert.equal(p.kind, 'downgrade-model');
  assert.equal(p.savingUsd, 10, '出力 100 万トークン: opus $20 → sonnet $10');
  assert.match(p.next, /run-canary\.mjs --agent reviewer --model claude-sonnet-5-5/);
  const failed = proposeChanges({ agents, rows, pricing, policy, canary: [{ agent: 'reviewer', candidate: 'claude-sonnet-5-5', verdict: 'fail-quality' }] });
  assert.match(failed[0].next, /据え置き/);
  const passed = proposeChanges({ agents, rows, pricing, policy, canary: [{ agent: 'reviewer', candidate: 'claude-sonnet-5-5', verdict: 'pass' }] });
  assert.match(passed[0].next, /変えてよい/);
  // mutation: 節約の下限を上げると出ない
  assert.equal(proposeChanges({ agents, rows, pricing, policy: { ...policy, minSavingUsd: 11 } }).length, 0);
});

test('別名が系統の最新版でない版に解決されていれば stale-alias を出す (agent と CI の両方)', () => {
  const rows = [subRow({ runs: 1, model: 'claude-sonnet-5', effort: 'high', costUsd: 1 })];
  const agents = [{ name: 'reviewer', model: 'sonnet', effort: 'high' }];
  const ciRuns = [{ workflow: 'loop', runs: 4, costUsd: 8, models: { 'claude-sonnet-5': 4 } }];
  const p = proposeChanges({ agents, rows, pricing, policy, ciRuns });
  assert.deepEqual(p.map((x) => x.id).sort(), ['stale-alias:ci:loop', 'stale-alias:reviewer']);
  const fresh = proposeChanges({ agents, rows: [subRow({ runs: 1, model: 'claude-sonnet-5-5', effort: 'high', costUsd: 1 })], pricing, policy, ciRuns: [{ ...ciRuns[0], models: { 'claude-sonnet-5-5': 4, unknown: 1 } }] });
  assert.equal(fresh.length, 0, '最新版と model 不明 (旧行) では出さない');
});

test('CI の history.csv は窓内の行だけ workflow ごとに集計し、model / effort 列が無い旧行は unknown', () => {
  const csv = [
    'date,workflow,run_id,limit,items,turns,duration_ms,cost_usd,input,output,cache_write,cache_read,token_source,is_error,model,effort',
    '2026-08-01,loop,1,2,2,1,1,9,0,0,0,0,result,0,,',
    '2026-09-30,loop,2,2,2,1,1,2,0,0,0,0,result,0',
    '2026-10-01,loop,3,2,4,1,1,4,0,0,0,0,result,1,claude-sonnet-5-5,high',
  ].join('\n');
  const [w] = summarizeCi(csv, 28, new Date('2026-10-02T00:00:00Z'));
  assert.equal(w.runs, 2);
  assert.equal(w.costPerItem, 1);
  assert.equal(w.errors, 1);
  assert.deepEqual(w.models, { unknown: 1, 'claude-sonnet-5-5': 1 });
});

test('buildReport は同じ agent × 候補の canary を最新 1 件だけ使う', () => {
  const report = buildReport({
    localDocs: [{ platform: 'mac', rows: [subRow({ runs: 3, effort: 'high' })] }],
    agents: [{ name: 'reviewer', model: 'opus', effort: 'high' }],
    ciCsv: null,
    canary: [
      { file: 'a.json', agent: 'reviewer', candidate: { model: 'claude-sonnet-5-5', effort: 'high' }, verdict: 'fail-quality' },
      { file: 'b.json', agent: 'reviewer', candidate: { model: 'claude-sonnet-5-5', effort: 'high' }, verdict: 'pass' },
    ],
    pricing,
    policy,
    now: new Date('2026-10-02T00:00:00Z'),
  });
  assert.equal(report.canary.length, 1);
  assert.equal(report.proposals[0].canary, 'pass');
});

test('canary の採点: 正解の語句で当て、判定は recall 低下 → 費用超過 → 合格の順', () => {
  const expected = [{ id: 'a', anyOf: ['インジェクション'] }, { id: 'b', anyOf: ['off-by-one'] }];
  assert.equal(scoreOutput('SQL インジェクション', expected).recall, 0.5);
  const run = (recall, costUsd) => ({ recall, costUsd, isError: false });
  const rules = { maxRecallDrop: 0, maxCostRatio: 1 };
  assert.equal(judge([run(1, 1)], [run(0.5, 0.1)], rules).verdict, 'fail-quality');
  assert.equal(judge([run(1, 1)], [run(1, 2)], rules).verdict, 'fail-cost');
  assert.equal(judge([run(1, 1)], [run(1, 0.5)], rules).verdict, 'pass');
  assert.equal(judge([run(1, 1)], [{ ...run(1, 0.5), isError: true }], rules).verdict, 'error');
  // mutation: recall 低下を許容すると合格になる
  assert.equal(judge([run(1, 1)], [run(0.75, 0.5)], { ...rules, maxRecallDrop: 0.25 }).verdict, 'pass');
});

test('採点器を直したら保存済みの出力を採点し直し、費用は元の記録を使う', () => {
  const fixture = { fixtureVersion: 2, cases: [{ id: 'basic', prompt: 'p', expected: [{ id: 'zero', anyOf: ['実際の\\s*0'] }] }] };
  const doc = {
    fixture: { file: 'f.json', version: 1, expected: ['basic/zero'] },
    verdict: 'fail-quality',
    runs: { baseline: [{ recall: 1, costUsd: 1, isError: false }], candidate: [{ recall: 0, costUsd: 0.5, isError: false }] },
  };
  const raw = { 'baseline-1-basic': '実際の 0 を隠す', 'candidate-1-basic': '実際の 0 値と欠損値を区別できない' };
  const next = rescore(doc, fixture, (side, n, id) => raw[`${side}-${n}-${id}`], { maxRecallDrop: 0, maxCostRatio: 1.1 });
  assert.equal(next.verdict, 'pass');
  assert.equal(next.fixture.version, 2);
  assert.equal(next.runs.candidate[0].costUsd, 0.5);
  assert.ok(next.rescoredAt);
});

test('cases の無い旧形式の fixture も 1 件の case として読む', () => {
  assert.deepEqual(fixtureCases({ prompt: 'p', expected: [] }), [{ id: 'default', prompt: 'p', expected: [] }]);
});
