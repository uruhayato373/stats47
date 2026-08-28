'use strict';

/**
 * backlog routing policy の週次学習を行う純関数。
 * I/O と時計は呼び出し側が注入し、同じ ledger / policy / usage から同じ結論を返す。
 */

const { summarizeByClassModel } = require('./ledger-core.cjs');

const ROUTABLE_MODELS = new Set(['sonnet', 'fable']);

function parseUsageHistory(csvText) {
  const lines = String(csvText ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function finiteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeUsage(rows, { since }) {
  const sinceDate = since.slice(0, 10);
  const selected = rows.filter((row) => row.workflow === 'backlog-loop' && row.date >= sinceDate);
  const measured = selected.filter((row) => row.token_source && row.token_source !== 'none');
  const sum = (source, field) =>
    source.reduce((total, row) => total + (finiteNumber(row[field]) ?? 0), 0);

  const items = sum(selected, 'items');
  const costUsd = sum(selected, 'cost_usd');
  return {
    runs: selected.length,
    measuredTokenRuns: measured.length,
    errorRuns: selected.filter((row) => finiteNumber(row.is_error) === 1).length,
    items,
    turns: sum(selected, 'turns'),
    durationMs: sum(selected, 'duration_ms'),
    costUsd,
    averageCostUsdPerItem: items > 0 ? costUsd / items : null,
    tokens: {
      input: sum(measured, 'input'),
      output: sum(measured, 'output'),
      cacheWrite: sum(measured, 'cache_write'),
      cacheRead: sum(measured, 'cache_read'),
    },
  };
}

function nextRoute(currentModel, successRate, guards) {
  if (successRate < guards.promoteIfSuccessRate) {
    if (currentModel === 'sonnet') {
      return { decision: 'promote', targetModel: 'fable', shouldChange: true };
    }
    return { decision: 'human-review-ceiling', targetModel: 'needs-owner', shouldChange: false };
  }

  if (successRate >= guards.demoteIfSuccessRate) {
    if (currentModel === 'fable') {
      return { decision: 'demote', targetModel: 'sonnet', shouldChange: true };
    }
    return { decision: 'stable-at-floor', targetModel: currentModel, shouldChange: false };
  }

  return { decision: 'stable', targetModel: currentModel, shouldChange: false };
}

function delegateFor(model) {
  if (model === 'fable') return 'agent:backlog-solver-hard';
  if (model === 'sonnet') return 'inline';
  return 'none';
}

function evaluateRoutingPolicy({ policy, ledger, usageRows, now }) {
  const observedAt = new Date(now);
  if (Number.isNaN(observedAt.getTime())) throw new Error(`invalid now: ${now}`);

  const guards = policy?.guards ?? {};
  const minSamples = finiteNumber(guards.minSamples);
  const windowDays = finiteNumber(guards.windowDays);
  const promoteIfSuccessRate = finiteNumber(guards.promoteIfSuccessRate);
  const demoteIfSuccessRate = finiteNumber(guards.demoteIfSuccessRate);
  if (
    minSamples === null ||
    windowDays === null ||
    promoteIfSuccessRate === null ||
    demoteIfSuccessRate === null
  ) {
    throw new Error('policy.guards の数値が不足している');
  }

  const sinceDate = new Date(observedAt.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const since = sinceDate.toISOString();
  const stats = summarizeByClassModel(ledger, { since });
  const statsByKey = new Map(stats.map((row) => [`${row.class}::${row.model}`, row]));
  const decisions = [];
  const changes = [];

  for (const [className, route] of Object.entries(policy.classes ?? {})) {
    const currentModel = route?.model;
    if (!ROUTABLE_MODELS.has(currentModel)) continue;

    const observed = statsByKey.get(`${className}::${currentModel}`) ?? {
      total: 0,
      completed: 0,
      successRate: null,
      costUsd: 0,
      turns: 0,
    };
    if (observed.total < minSamples) {
      decisions.push({
        class: className,
        model: currentModel,
        samples: observed.total,
        completed: observed.completed,
        successRate: observed.successRate,
        decision: 'insufficient-sample',
        targetModel: currentModel,
        policyChanged: false,
      });
      continue;
    }

    const routeDecision = nextRoute(currentModel, observed.successRate, {
      promoteIfSuccessRate,
      demoteIfSuccessRate,
    });
    decisions.push({
      class: className,
      model: currentModel,
      samples: observed.total,
      completed: observed.completed,
      successRate: observed.successRate,
      decision: routeDecision.decision,
      targetModel: routeDecision.targetModel,
      policyChanged: routeDecision.shouldChange,
    });
    if (routeDecision.shouldChange) {
      changes.push({
        class: className,
        from: currentModel,
        to: routeDecision.targetModel,
        samples: observed.total,
        completed: observed.completed,
        successRate: observed.successRate,
      });
    }
  }

  let nextPolicy = policy;
  if (changes.length > 0) {
    const classes = { ...policy.classes };
    for (const change of changes) {
      classes[change.class] = {
        ...classes[change.class],
        model: change.to,
        delegate: delegateFor(change.to),
      };
    }
    nextPolicy = {
      ...policy,
      version: (finiteNumber(policy.version) ?? 0) + 1,
      updatedAt: observedAt.toISOString().slice(0, 10),
      updatedBy: 'backlog-routing-policy-weekly',
      classes,
    };
  }

  const usage = summarizeUsage(usageRows, { since });
  const evaluation = {
    schemaVersion: 1,
    eval: 'backlog-routing-policy',
    generatedAt: observedAt.toISOString(),
    window: { since, until: observedAt.toISOString(), days: windowDays },
    sources: {
      ledger: '.claude/state/backlog-loop/ledger.json',
      usageHistory: '.claude/state/metrics/claude-usage/history.csv',
      policy: '.claude/config/backlog-routing-policy.json',
    },
    guards: {
      minSamples,
      windowDays,
      promoteIfSuccessRate,
      demoteIfSuccessRate,
    },
    usage,
    observedClassModels: stats,
    decisions,
    policyUpdate: {
      changed: changes.length > 0,
      beforeVersion: policy.version ?? null,
      afterVersion: nextPolicy.version ?? null,
      changes,
    },
    limitations: [
      'usage history is workflow-level and is not attributed to individual class-model attempts',
      'ledger does not encode factual-error or scope-violation counts',
    ],
  };

  return { policy: nextPolicy, evaluation, changes };
}

module.exports = {
  ROUTABLE_MODELS,
  parseUsageHistory,
  summarizeUsage,
  nextRoute,
  evaluateRoutingPolicy,
};
