#!/usr/bin/env node
/** One bounded catch-up from the existing health workflow, not a replacement for schedule evidence. */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { evaluateSchedule } from '../lib/workflow-health-core.mjs';

const REPO = 'uruhayato373/stats47';
const WORKFLOW = 'authenticated-measurement.yml';

export function catchUpDecision(workflow, runs, now = Date.now()) {
  if (workflow?.state !== 'active') return { dispatch: false, reason: 'workflow_not_active' };
  if (!Array.isArray(runs)) throw new Error('invalid_run_history');
  const normalized = runs.map(run => ({ ...run, createdAt: run.created_at, event: run.event }));
  const schedule = evaluateSchedule(WORKFLOW, normalized, now);
  if (!schedule?.code) return { dispatch: false, reason: 'schedule_not_overdue' };
  const expected = Date.parse(schedule.expectedAt);
  if (runs.some(run => run.head_branch && ['main', 'develop'].includes(run.head_branch)
    && (run.status !== 'completed' || (Date.parse(run.created_at) >= expected && Date.parse(run.created_at) <= now)))) {
    return { dispatch: false, reason: 'run_already_present', expectedAt: schedule.expectedAt };
  }
  return { dispatch: true, reason: schedule.code, expectedAt: schedule.expectedAt };
}

function gh(...args) { return execFileSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }); }
export function runCatchUp({ dispatch = false, api = gh, env = process.env, now = Date.now() } = {}) {
  const endpoint = `repos/${REPO}/actions/workflows/${WORKFLOW}`;
  const workflow = JSON.parse(api(endpoint));
  const response = JSON.parse(api(`${endpoint}/runs?per_page=100`));
  const decision = catchUpDecision(workflow, response.workflow_runs, now);
  if (!dispatch || !decision.dispatch) return { ...decision, submitted: false };
  // Mutations are confined to the trusted, existing CI environment and one fixed collector.
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== REPO
    || !['refs/heads/main', 'refs/heads/develop'].includes(env.GITHUB_REF)) throw new Error('catchup_dispatch_ci_only');
  // Reserve the slot before POST, using Contents API's blob SHA as a compare-and-swap.
  // A lost POST response consumes the reservation too: no blind repeat while run listing catches up.
  const claimEndpoint = `repos/${REPO}/contents/.claude/state/ci/authenticated-catchup.json`;
  const file = JSON.parse(api(`${claimEndpoint}?ref=develop`));
  const previous = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  if (!file.sha || previous.schemaVersion !== 1 || (previous.expectedAt !== null && !Number.isFinite(Date.parse(previous.expectedAt)))) {
    throw new Error('catchup_reservation_invalid');
  }
  if (previous.expectedAt && Date.parse(previous.expectedAt) >= Date.parse(decision.expectedAt)) {
    return { ...decision, dispatch: false, submitted: false, reason: 'slot_already_reserved' };
  }
  const claim = { schemaVersion: 1, expectedAt: decision.expectedAt, reservedAt: new Date(now).toISOString(),
    healthRunId: env.GITHUB_RUN_ID ?? null, state: 'reserved_before_dispatch' };
  const saved = JSON.parse(api('--method', 'PUT', claimEndpoint, '-f', 'branch=develop', '-f', `sha=${file.sha}`,
    '-f', 'message=chore(ci): reserve measurement catch-up [skip ci]',
    '-f', `content=${Buffer.from(JSON.stringify(claim, null, 2) + '\n').toString('base64')}`));
  if (!saved.content?.sha) throw new Error('catchup_reservation_unconfirmed');
  api('--method', 'POST', `${endpoint}/dispatches`, '-f', 'ref=main', '-f', `inputs[catchup_slot]=${decision.expectedAt}`);
  return { ...decision, submitted: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(runCatchUp({ dispatch: process.argv.includes('--dispatch') }))); }
  catch { console.error('measurement_catchup_check_failed'); process.exitCode = 1; }
}
