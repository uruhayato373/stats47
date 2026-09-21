import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { catchUpDecision, runCatchUp } from '../catch-up.mjs';

const now = Date.parse('2026-09-22T00:00:00Z');
const active = { state: 'active' };
const run = { event: 'workflow_dispatch', head_branch: 'main', created_at: '2026-09-21T16:00:00Z', status: 'completed', conclusion: 'failure' };
test('a missing daily run gets at most one catch-up, even if that run fails', () => {
  assert.deepEqual(catchUpDecision(active, [], now), { dispatch: true, reason: 'scheduled_run_missing', expectedAt: '2026-09-21T09:20:00.000Z' });
  assert.equal(catchUpDecision(active, [run], now).reason, 'run_already_present');
  assert.equal(catchUpDecision(active, [{ ...run, event: 'push', head_branch: 'develop' }], now).dispatch, false);
  assert.equal(catchUpDecision(active, [{ ...run, status: 'queued', created_at: '2026-09-20T00:00:00Z' }], now).dispatch, false);
  assert.equal(catchUpDecision(active, [{ ...run, head_branch: 'feature/untrusted' }], now).dispatch, true);
  assert.equal(catchUpDecision(active, [], Date.parse('2026-09-21T15:19:59Z')).dispatch, false);
  assert.equal(catchUpDecision({ state: 'disabled_manually' }, [], now).dispatch, false);
});
test('catch-up does not change schedule health; a real schedule run does', () => {
  assert.equal(catchUpDecision(active, [{ ...run, event: 'schedule' }], now).reason, 'schedule_not_overdue');
  assert.equal(catchUpDecision(active, [run], now + 86400000).dispatch, true);
  assert.throws(() => catchUpDecision(active, null, now), /invalid_run_history/);
});
test('durable slot reservation prevents duplicate dispatch before run history becomes visible', () => {
  for (const failPost of [false, true]) {
    let claim = { schemaVersion: 1, expectedAt: null }, sha = 'original', posts = 0;
    const api = (...args) => {
      if (args[0] === '--method' && args[1] === 'PUT') {
        assert.ok(args.includes(`sha=${sha}`));
        claim = JSON.parse(Buffer.from(args.find(a => a.startsWith('content=')).slice(8), 'base64').toString('utf8'));
        sha = 'reserved'; return JSON.stringify({ content: { sha } });
      }
      if (args[0] === '--method' && args[1] === 'POST') {
        posts++;
        if (failPost) throw new Error('response_lost');
        return '';
      }
      if (args[0].includes('/contents/')) return JSON.stringify({ sha, content: Buffer.from(JSON.stringify(claim)).toString('base64') });
      if (args[0].includes('/runs?')) return JSON.stringify({ workflow_runs: [] });
      return JSON.stringify(active);
    };
    const options = { dispatch: true, api, now, env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'uruhayato373/stats47', GITHUB_REF: 'refs/heads/main' } };
    if (failPost) assert.throws(() => runCatchUp(options), /response_lost/);
    else assert.equal(runCatchUp(options).submitted, true);
    assert.equal(runCatchUp(options).reason, 'slot_already_reserved');
    assert.equal(posts, 1);
    assert.throws(() => runCatchUp({ ...options, env: {} }), /ci_only/);
  }
});
test('a reservation conflict never reaches workflow dispatch', () => {
  let posts = 0;
  const api = (...args) => {
    if (args[1] === 'POST') { posts++; return ''; }
    if (args[1] === 'PUT') throw new Error('409 conflict');
    if (args[0].includes('/contents/')) return JSON.stringify({ sha: 'old', content: Buffer.from('{"schemaVersion":1,"expectedAt":null}').toString('base64') });
    if (args[0].includes('/runs?')) return '{"workflow_runs":[]}';
    return JSON.stringify(active);
  };
  assert.throws(() => runCatchUp({ dispatch: true, api, now,
    env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'uruhayato373/stats47', GITHUB_REF: 'refs/heads/main' } }), /conflict/);
  assert.equal(posts, 0);
});
test('existing health workflow owns the fixed catch-up and reports failures independently', () => {
  const health = yaml.load(readFileSync('.github/workflows/workflow-health-daily.yml', 'utf8'));
  const collector = yaml.load(readFileSync('.github/workflows/authenticated-measurement.yml', 'utf8'));
  assert.equal(health.permissions.actions, 'write');
  const step = health.jobs.audit.steps.find(step => step.id === 'measurement_catchup');
  assert.equal(step.if, 'always()');
  assert.match(step.run, /measurement\/catch-up\.mjs --dispatch/);
  const alert = health.jobs.audit.steps.find(step => step.name?.includes('連続失敗を Issue'));
  assert.match(alert.if, /steps\.measurement_catchup\.outcome != 'success'/);
  assert.ok(collector.on.workflow_dispatch.inputs.catchup_slot);
  assert.match(collector['run-name'], /catch-up/);
  const quality = yaml.load(readFileSync('.github/workflows/pr-quality-check.yml', 'utf8'));
  const gate = quality.jobs['contract-tests'].steps.find(step => step.name === 'Authenticated measurement isolation and freshness');
  assert.match(gate.run, /npm run note:metrics:test/);
  assert.match(gate.run, /workflow-health-core\.test\.mjs/);
});
