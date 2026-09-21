import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SOURCES } from './sources.mjs';

export function measurementHealth(state, now = Date.now()) {
  const age = now - Date.parse(state?.generatedAt);
  const fresh = Number.isFinite(age) && age >= -300000 && age <= 2 * 86400000;
  const sources = Object.entries(SOURCES).map(([source, config]) => {
    const item = state?.sources?.find(s => s.source === source);
    const sourceAge = now - Date.parse(item?.observedAt);
    const current = fresh && Number.isFinite(sourceAge) && sourceAge >= -300000 && sourceAge <= 2 * 86400000;
    const compatible = item?.capability === config.capability;
    return { source, capability: config.capability, status: !current ? 'stale' : !compatible ? 'failed' : item.status,
      code: !current ? 'measurement_stale' : !compatible ? 'capability_mismatch' : item.code ?? null,
      metricsAvailable: current && compatible && item.status === 'pass' && item.metricsAvailable === true,
      remaining: source === 'kdp' ? 'payout_and_net_profit_not_collected' : source === 'afb' ? 'net_payout_and_partnership_status_not_collected' : null };
  });
  return { fresh, status: sources.every(s => s.status === 'pass') ? 'pass' : 'action_required', sources };
}

export function readMeasurementHealth(root = '.', now = Date.now()) {
  const path = `${root}/.claude/state/metrics/authenticated/latest.json`;
  let state = null;
  try { if (existsSync(path)) state = JSON.parse(readFileSync(path, 'utf8')); } catch { /* malformed is missing, never healthy */ }
  return measurementHealth(state, now);
}

export function formatMeasurementHealth(health) {
  return ['最新の認証付き収集状態（週次KPIの期間とは別。欠測を0にしない）', '',
    '| 対象 | 収集範囲 | 状態 | 未取得・要対応 |', '|---|---|---|---|',
    ...health.sources.map(s => `| ${s.source} | ${s.capability} | ${s.status} | ${s.code ?? s.remaining ?? 'なし'} |`),
    '', '生データはprivate R2。status-onlyの成功・ローリング期間の値を確定7日の収益として合算しない。'].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const health = readMeasurementHealth();
  console.log(formatMeasurementHealth(health));
  if (process.argv.includes('--check') && health.status !== 'pass') process.exitCode = 1;
}
