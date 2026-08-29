'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseUsageHistory,
  summarizeUsage,
  evaluateRoutingPolicy,
} = require('../routing-policy-core.cjs');

const ROOT = path.resolve(__dirname, '../../../..');
const NOW = '2026-08-28T00:00:00.000Z';

function policyFor(model = 'sonnet') {
  return {
    version: 1,
    updatedAt: '2026-08-17',
    updatedBy: 'initial',
    classes: {
      'impl-small': {
        model,
        effort: 'high',
        maxAttempts: 2,
        delegate: model === 'fable' ? 'agent:backlog-solver-hard' : 'inline',
        apply: 'direct-push',
      },
    },
    guards: {
      minSamples: 8,
      windowDays: 28,
      demoteIfSuccessRate: 0.85,
      promoteIfSuccessRate: 0.5,
    },
  };
}

function ledgerWith(outcomes, model = 'sonnet', at = '2026-08-27T00:00:00.000Z') {
  return {
    version: 1,
    updatedAt: at,
    items: Object.fromEntries(
      outcomes.map((outcome, index) => [
        `ITEM-${index}`,
        {
          class: 'impl-small',
          status: outcome === 'completed' ? 'completed' : 'open',
          attempts: [{ at, model, outcome }],
        },
      ]),
    ),
  };
}

test('minSamples 未満では成功率に関係なく policy を変えない', () => {
  const result = evaluateRoutingPolicy({
    policy: policyFor(),
    ledger: ledgerWith(['failed', 'failed', 'failed', 'failed', 'failed', 'failed', 'failed']),
    usageRows: [],
    now: NOW,
  });

  assert.equal(result.changes.length, 0);
  assert.equal(result.evaluation.decisions[0].decision, 'insufficient-sample');
  assert.equal(result.policy.version, 1);
});

test('sonnet の成功率が昇格閾値未満なら fable 委譲へ変える', () => {
  const result = evaluateRoutingPolicy({
    policy: policyFor(),
    ledger: ledgerWith([
      'completed',
      'completed',
      'failed',
      'failed',
      'failed',
      'deferred',
      'skipped',
      'failed',
    ]),
    usageRows: [],
    now: NOW,
  });

  assert.deepEqual(result.changes, [
    {
      class: 'impl-small',
      from: 'sonnet',
      to: 'fable',
      samples: 8,
      completed: 2,
      successRate: 0.25,
    },
  ]);
  assert.equal(result.policy.classes['impl-small'].model, 'fable');
  assert.equal(result.policy.classes['impl-small'].delegate, 'agent:backlog-solver-hard');
  assert.equal(result.policy.classes['impl-small'].apply, 'direct-push');
  assert.equal(result.policy.version, 2);
});

test('fable の成功率が降格閾値以上なら sonnet inline へ変える', () => {
  const result = evaluateRoutingPolicy({
    policy: policyFor('fable'),
    ledger: ledgerWith(Array(8).fill('completed'), 'fable'),
    usageRows: [],
    now: NOW,
  });

  assert.equal(result.changes[0].to, 'sonnet');
  assert.equal(result.policy.classes['impl-small'].delegate, 'inline');
});

test('fable の低成功率は人間レビューを提示するが policy を自動停止しない', () => {
  const result = evaluateRoutingPolicy({
    policy: policyFor('fable'),
    ledger: ledgerWith(Array(8).fill('failed'), 'fable'),
    usageRows: [],
    now: NOW,
  });

  assert.equal(result.changes.length, 0);
  assert.equal(result.evaluation.decisions[0].decision, 'human-review-ceiling');
  assert.equal(result.policy.classes['impl-small'].model, 'fable');
});

test('windowDays より古い attempt は標本に数えない', () => {
  const result = evaluateRoutingPolicy({
    policy: policyFor(),
    ledger: ledgerWith(Array(8).fill('failed'), 'sonnet', '2026-07-01T00:00:00.000Z'),
    usageRows: [],
    now: NOW,
  });

  assert.equal(result.evaluation.decisions[0].samples, 0);
  assert.equal(result.changes.length, 0);
});

test('usage history は backlog-loop の窓内実測だけを集計する', () => {
  const rows = parseUsageHistory([
    'date,workflow,run_id,limit,items,turns,duration_ms,cost_usd,input,output,cache_write,cache_read,token_source,is_error',
    '2026-08-27,backlog-loop,1,2,2,10,1000,3.5,1,20,30,40,result,0',
    '2026-08-26,blog,2,1,1,5,500,1.0,1,2,3,4,result,0',
    '2026-07-01,backlog-loop,3,2,0,1,100,0.2,0,0,0,0,none,1',
  ].join('\n'));
  const summary = summarizeUsage(rows, { since: '2026-08-01T00:00:00.000Z' });

  assert.deepEqual(summary, {
    runs: 1,
    measuredTokenRuns: 1,
    errorRuns: 0,
    items: 2,
    turns: 10,
    durationMs: 1000,
    costUsd: 3.5,
    averageCostUsdPerItem: 1.75,
    tokens: { input: 1, output: 20, cacheWrite: 30, cacheRead: 40 },
  });
});

test('Phase 3 route は fable・hard agent・draft PR に固定される', () => {
  const policy = JSON.parse(
    fs.readFileSync(path.join(ROOT, '.claude/config/backlog-routing-policy.json'), 'utf8'),
  );
  const route = policy.classes['indicator-expansion'];

  assert.equal(route.model, 'fable');
  assert.equal(route.delegate, 'agent:backlog-solver-hard');
  assert.equal(route.apply, 'draft-pr');
  assert.equal(route.maxAttempts, 1);
});

test('週次 workflow は policy CLI の出力だけを develop へ提案する', () => {
  const workflow = fs.readFileSync(
    path.join(ROOT, '.github/workflows/backlog-routing-policy-weekly.yml'),
    'utf8',
  );

  assert.match(workflow, /update-routing-policy\.mjs/);
  assert.match(workflow, /\.claude\/config\/backlog-routing-policy\.json/);
  assert.match(workflow, /\.claude\/state\/metrics\/prompt-evals\//);
  assert.match(workflow, /ref: develop/);
  assert.doesNotMatch(workflow, /\.claude\/agents\/.*model:/);
  assert.doesNotMatch(workflow, /itemsPerRun\s*[:=]/);
});
