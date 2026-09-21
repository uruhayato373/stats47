/** Exact canonical restore allowlist. Sessions, diagnostics and arbitrary paths never leave the vault. */
import { sourceFor } from './sources.mjs';
export function consumerPath(name, path) {
  if (name === 'moshimo' && path === '.claude/state/metrics/affiliate/moshimo-results.json') return path;
  if (name === 'a8' && /^\.claude\/state\/metrics\/affiliate\/a8-(results|report-log|ui-last-run)\.json$/.test(path)) return path;
  if (name === 'gsc' && /^\.claude\/state\/metrics\/gsc\/coverage-drilldown\/\d{4}-W\d{2}\/[a-z0-9_-]+\.(csv|json)$/.test(path)) return path;
  if (name === 'note') {
    const match = /^\.local\/authenticated-measurement\/note-\d+\/note\/(latest\.json|cover-metrics-latest\.(json|csv))$/.exec(path);
    if (match) return `.claude/state/metrics/note/dashboard/${match[1]}`;
  }
  if (name === 'coconala' && /^\.local\/authenticated-measurement\/coconala-\d+\/status\.json$/.test(path)) return '.local/authenticated-measurement/restored/coconala.json';
  if (name === 'kdp' && /^\.local\/authenticated-measurement\/kdp-\d+\/status\.json$/.test(path)) return '.local/authenticated-measurement/restored/kdp.json';
  return null;
}

export function validateAttempt(attempt, now = Date.now(), source = null) {
  if (!attempt || attempt.status !== 'pass') throw new Error('latest_collection_not_successful');
  if (source && (attempt.source !== source || attempt.capability !== sourceFor(source).capability)) throw new Error('capability_mismatch');
  const age = now - Date.parse(attempt.observedAt);
  if (!Number.isFinite(age) || age < -300000 || age > 2 * 86400000) throw new Error('measurement_stale');
}
