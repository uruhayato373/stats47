import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SOURCES, MEASUREMENT_MAX_AGE_MS } from './sources.mjs';
import { runPreflight, formatPreflight, agentView } from './session-preflight.mjs';

export function measurementHealth(state, now = Date.now()) {
  const age = now - Date.parse(state?.generatedAt);
  const fresh = Number.isFinite(age) && age >= -300000 && age <= MEASUREMENT_MAX_AGE_MS;
  const sources = Object.entries(SOURCES).map(([source, config]) => {
    const item = state?.sources?.find(s => s.source === source);
    const sourceAge = now - Date.parse(item?.observedAt);
    const current = fresh && Number.isFinite(sourceAge) && sourceAge >= -300000 && sourceAge <= MEASUREMENT_MAX_AGE_MS;
    const compatible = item?.capability === config.capability;
    return { source, capability: config.capability, status: !current ? 'stale' : !compatible ? 'failed' : item.status,
      code: !current ? 'measurement_stale' : !compatible ? 'capability_mismatch' : item.code ?? null,
      metricsAvailable: current && compatible && item.status === 'pass' && item.metricsAvailable === true,
      inventoryAvailable: current && compatible && source === 'note' && item.inventoryAvailable === true
        && (item.status === 'pass' || (item.status === 'failed' && item.code === 'report_incomplete')),
      awaitingReauthentication: current && compatible && item.status === 'failed' && item.code === 'auth_required'
        && item.recovery?.state === 'awaiting_reauthentication',
      remaining: source === 'kdp' ? 'payout_and_net_profit_not_collected' : null };
  });
  return { fresh, status: sources.every(s => s.status === 'pass') ? 'pass' : 'action_required', sources };
}

export function readMeasurementHealth(root = '.', now = Date.now()) {
  const path = `${root}/data/authenticated/latest.json`;
  let state = null;
  try { if (existsSync(path)) state = JSON.parse(readFileSync(path, 'utf8')); } catch { /* malformed is missing, never healthy */ }
  return measurementHealth(state, now);
}

export function formatMeasurementHealth(health) {
  return ['最新の認証付き収集状態（週次KPIの期間とは別。欠測を0にしない）', '',
    '| 対象 | 収集範囲 | 状態 | 未取得・要対応 |', '|---|---|---|---|',
    ...health.sources.map(s => `| ${s.source} | ${s.capability} | ${s.status} | ${s.code ?? s.remaining ?? 'なし'}${s.awaitingReauthentication ? '（本人の再認証待ち・再接続停止）' : ''}${s.inventoryAvailable ? '（記事棚卸しのみ利用可・全件KPI不可）' : ''} |`),
    '', '生データはprivate R2。status-onlyの成功・ローリング期間の値を確定7日の収益として合算しない。'].join('\n');
}

// 保存済みセッションの事前確認 (session-preflight.mjs) を同じ出力に足す。--check の判定 (終了コード) は収集状態だけで決め、事前確認は混ぜない。
//   --preflight        : 事前確認だけを出す
//   --json             : JSON で出す (--preflight と組むと agent 向けの最小形 = 取得元ごとの状態と期限だけ)
//   --root PATH        : .local のプロファイルを読む checkout (worktree から main checkout のプロファイルを見るとき)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex < 0 ? '.' : args[rootIndex + 1];
  const preflight = runPreflight({ root });
  if (args.includes('--preflight')) {
    console.log(args.includes('--json') ? JSON.stringify(agentView(preflight), null, 2) : formatPreflight(preflight));
  } else {
    const health = readMeasurementHealth(root);
    if (args.includes('--json')) console.log(JSON.stringify({ health, preflight: agentView(preflight) }, null, 2));
    else console.log(`${formatMeasurementHealth(health)}\n\n${formatPreflight(preflight)}`);
    if (args.includes('--check') && health.status !== 'pass') process.exitCode = 1;
  }
}
