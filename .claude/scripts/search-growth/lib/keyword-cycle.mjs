/** One keyword per run; ranking observations never imply causation. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { addDays, jstDateOf, resolvePeriods } from '../../metrics/lib/periods.mjs';

export const METHODS = ['title', 'description', 'intro', 'faq', 'content', 'internal-links', 'data'];
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const pairKey = row => JSON.stringify([row.keyword, row.targetPath]);
export function sitePath(value) {
  const url = new URL(value, 'https://stats47.jp');
  assert.equal(url.origin, 'https://stats47.jp', 'foreign site');
  assert.ok(!url.search && !url.hash && !url.username && !url.password, 'canonical URL required');
  return url.pathname;
}
export function validateSnapshot(snapshot, today = jstDateOf()) {
  assert.equal(snapshot.siteUrl, 'sc-domain:stats47.jp');
  assert.equal(snapshot.asOf, today, 'stale GSC snapshot');
  const periods = resolvePeriods({ source: 'gsc', asOf: today, now: today + 'T03:00:00Z' });
  for (const key of ['current', 'previous']) {
    const window = snapshot[key];
    assert.deepEqual(window.period, periods[key === 'current' ? 'finalized7d' : 'previous7d']);
    assert.equal(window.dataState, 'final');
    assert.equal(window.coverage.status, 'complete', 'incomplete daily GSC coverage');
    const seen = new Set();
    for (const row of window.rows) {
      assert.ok(typeof row.keyword === 'string' && row.keyword.trim());
      assert.equal(sitePath(row.targetPath), row.targetPath);
      assert.ok(Number.isFinite(row.rank) && row.rank >= 1);
      assert.ok(Number.isFinite(row.impressions) && row.impressions > 0);
      assert.ok(!seen.has(pairKey(row)), 'duplicate query/page');
      seen.add(pairKey(row));
    }
  }
}
export function validateLog(log) {
  assert.equal(log.schemaVersion, 1);
  const seen = new Set();
  for (const entry of log.entries) {
    assert.ok(!seen.has(entry.keyword), 'one target per keyword'); seen.add(entry.keyword);
    sitePath(entry.targetPath);
    assert.ok(['active', 'observing', 'achieved'].includes(entry.status));
    assert.ok(Array.isArray(entry.actions));
    if (entry.status === 'observing') {
      const action = entry.actions.at(-1);
      assert.ok(action?.date && action.deployment);
      assert.equal(entry.nextReviewDate, addDays(action.date, 7));
    }
  }
}
export function reviewDue(log, snapshot, today = snapshot.asOf) {
  validateLog(log); validateSnapshot(snapshot, today);
  const updated = structuredClone(log), verdicts = [];
  const rows = new Map(snapshot.current.rows.map(row => [pairKey(row), row]));
  for (const entry of updated.entries) {
    if (entry.status !== 'observing' || entry.nextReviewDate > today) continue;
    const action = entry.actions.at(-1), row = rows.get(pairKey(entry));
    // Deployment day is partial, so the entire finalized window must be later.
    const reason = snapshot.current.period.periodStart <= action.date ? 'post-deployment-window-incomplete'
      : !row ? 'query-page-not-reported' : null;
    if (reason) {
      const attempt = { date: today, outcome: 'insufficient-data', reason, period: snapshot.current.period, snapshotHash: hash(snapshot) };
      entry.reviews ??= [];
      if (entry.reviews.at(-1)?.snapshotHash !== attempt.snapshotHash) entry.reviews.push(attempt);
      verdicts.push({ keyword: entry.keyword, status: 'observing', reason }); continue;
    }
    const outcome = row.rank <= 1 ? 'achieved' : action.rankAtAction == null ? 'baseline-unavailable'
      : row.rank < action.rankAtAction ? 'improved' : 'no-improvement';
    entry.status = outcome === 'achieved' ? 'achieved' : 'active';
    entry.nextReviewDate = null;
    entry.lastReview = { date: today, outcome, before: action.rankAtAction, after: row.rank,
      period: snapshot.current.period, snapshotHash: hash(snapshot), attribution: 'observed-change-only' };
    entry.reviews ??= []; entry.reviews.push(entry.lastReview);
    verdicts.push({ keyword: entry.keyword, status: entry.status, ...entry.lastReview });
  }
  return { log: updated, verdicts };
}
export function selectKeyword({ keywords, log, snapshot, pending = [] }) {
  validateSnapshot(snapshot); validateLog(log);
  const keywordNames = new Set();
  for (const entry of keywords.keywords) {
    assert.ok(typeof entry.keyword === 'string' && entry.keyword.trim() && !keywordNames.has(entry.keyword));
    keywordNames.add(entry.keyword); assert.equal(sitePath(entry.targetPath), entry.targetPath);
    assert.ok(entry.priority == null || ['high', 'normal'].includes(entry.priority));
  }
  const entries = new Map(log.entries.map(entry => [entry.keyword, entry]));
  const rows = new Map(snapshot.current.rows.map(row => [pairKey(row), row]));
  const blocked = new Set([...log.entries.filter(e => ['observing', 'achieved'].includes(e.status)), ...pending].map(e => e.keyword));
  const blockedPaths = new Set([...log.entries.filter(e => e.status === 'observing'), ...pending].map(e => e.targetPath));
  const registered = new Map([...keywords.keywords, ...log.entries].map(e => [e.keyword, e]));
  const candidates = [];
  for (const entry of registered.values()) {
    if (blocked.has(entry.keyword) || blockedPaths.has(entry.targetPath)) continue;
    const row = rows.get(pairKey(entry));
    if (row?.rank <= 1) continue;
    const rank = row?.rank ?? null, impressions = row?.impressions ?? 0;
    const previous = entries.get(entry.keyword);
    const group = rank > 1 && rank <= 10 && impressions > 0 ? 1
      : rank > 10 && rank <= 20 && impressions > 0 ? 2
        : ['improved', 'no-improvement'].includes(previous?.lastReview?.outcome) ? 3
          : rank == null && entry.priority === 'high' ? 4 : null;
    if (group) candidates.push({ keyword: entry.keyword, targetPath: entry.targetPath, rank, impressions, group,
      previousMethod: previous?.lastReview?.outcome === 'no-improvement' ? previous.actions.at(-1)?.method : null,
      previousMethods: previous?.lastReview?.outcome === 'no-improvement' ? previous.actions.at(-1)?.methods ?? [previous.actions.at(-1)?.method] : [] });
  }
  for (const row of snapshot.current.rows) {
    if (registered.has(row.keyword) || blocked.has(row.keyword) || blockedPaths.has(row.targetPath)) continue;
    if (row.rank > 1 && row.rank <= 20 && row.impressions > 0) candidates.push({ ...row, group: 5, previousMethod: null });
  }
  candidates.sort((a, b) => a.group - b.group || (a.group === 1 ? a.rank - b.rank : b.impressions - a.impressions)
    || (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.keyword.localeCompare(b.keyword, 'ja') || a.targetPath.localeCompare(b.targetPath));
  return candidates[0] ?? null;
}
export function rankingMovements(snapshot) {
  const previous = new Map(snapshot.previous.rows.map(row => [pairKey(row), row]));
  return snapshot.current.rows.flatMap(row => {
    const before = previous.get(pairKey(row));
    return before && Math.abs(before.rank - row.rank) >= 3
      ? [{ keyword: row.keyword, targetPath: row.targetPath, before: before.rank, after: row.rank, beforeImpressions: before.impressions, impressions: row.impressions, change: before.rank - row.rank }] : [];
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
}
export function recordDeployment(log, proposal, snapshot, deployment) {
  validateSnapshot(snapshot, snapshot.asOf); validateLog(log);
  assert.equal(deployment.date, snapshot.asOf);
  assert.match(deployment.sha, /^[a-f0-9]{40}$/);
  const updated = structuredClone(log);
  let entry = updated.entries.find(e => e.keyword === proposal.keyword);
  if (entry?.actions.some(a => a.proposalId === proposal.id)) return updated;
  assert.ok(!entry || entry.status === 'active', 'cooldown/achieved lock');
  assert.ok(!updated.entries.some(e => e.status === 'observing' && e.targetPath === proposal.targetPath), 'page cooldown');
  const row = snapshot.current.rows.find(r => pairKey(r) === pairKey(proposal));
  if (!entry) { entry = { keyword: proposal.keyword, targetPath: proposal.targetPath, status: 'active', actions: [] }; updated.entries.push(entry); }
  assert.equal(entry.targetPath, proposal.targetPath, 'target changes need a new explicit baseline');
  if (entry.lastReview?.outcome === 'no-improvement') assert.notEqual(entry.actions.at(-1)?.method, proposal.method);
  entry.actions.push({ date: deployment.date, rankAtAction: row?.rank ?? null, baselinePeriod: snapshot.current.period,
    baselineHash: hash(snapshot), needs: proposal.needs, done: proposal.done, method: proposal.method,
    proposalId: proposal.id, deployment, files: proposal.files, methods: proposal.methods ?? [proposal.method] });
  entry.status = 'observing'; entry.nextReviewDate = addDays(deployment.date, 7);
  return updated;
}
