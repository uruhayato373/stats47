#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { SOURCES } from './sources.mjs';

const input = process.argv[2] || '.local/authenticated-ci-public';
const output = '.claude/state/metrics/authenticated/latest.json';
const previous = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : { sources: [] };
const filenames = existsSync(input) ? readdirSync(input) : [];
const sources = Object.entries(SOURCES).map(([source, config]) => {
  // Highest attempt wins even when failed/malformed; never fall back to an older success.
  // Legacy source.json: remove after 2026-10-21 (30-day artifact retention).
  const candidates = filenames.flatMap(file => {
    const match = new RegExp(`^${source}-([1-9]\\d*)\\.json$`).exec(file);
    return match ? [{ file, attempt: Number(match[1]) }] : [];
  }).sort((a, b) => b.attempt - a.attempt);
  const selected = candidates[0];
  const path = join(input, selected?.file ?? `${source}.json`);
  let value = {};
  try { if (existsSync(path)) value = JSON.parse(readFileSync(path, 'utf8')); } catch { /* malformed artifacts fail closed */ }
  const age = Date.now() - Date.parse(value?.observedAt);
  const valid = value?.source === source && value.capability === config.capability
    && (!selected || (Number.isSafeInteger(selected.attempt) && value.runAttempt === selected.attempt
      && (!process.env.GITHUB_RUN_ATTEMPT || selected.attempt <= Number(process.env.GITHUB_RUN_ATTEMPT))))
    && Number.isFinite(age) && age >= -300000 && age <= 2 * 86400000
    && (!process.env.GITHUB_RUN_ID || value.runId === process.env.GITHUB_RUN_ID);
  if (!valid) value = { code: existsSync(path) ? 'invalid_observation' : 'runner_failed' };
  return { source, capability: config.capability, observedAt: value.observedAt ?? null,
    activated: value.status === 'pass' || previous.sources?.some(s => s.source === source && s.activated === true) || false,
    status: value.status === 'pass' ? 'pass' : 'failed', code: value.code ?? (value.status === 'pass' ? null : 'runner_failed'),
    runId: value.runId ?? process.env.GITHUB_RUN_ID ?? null,
    runAttempt: value.runAttempt ?? null,
    metricsAvailable: value.status === 'pass' && value.metricsAvailable === true,
    evidence: value.evidence ?? null,
    quality: value.quality ?? null,
    remaining: source === 'kdp' ? 'payout_and_net_profit_not_collected' : source === 'afb' ? 'net_payout_and_partnership_status_not_collected' : null,
  };
});
const state = { schemaVersion: 1, generatedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID ?? null, sources,
  status: sources.every(s => s.status === 'pass') ? 'pass' : 'action_required' };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(state, null, 2) + '\n');
const lines = ['認証付き計測の最新試行。生データと認証状態は暗号化したprivate R2に保存。', '',
  '| 対象 | 収集範囲 | 状態 | 次の操作 |', '|---|---|---|---|',
  ...sources.map(s => `| ${s.source} | ${s.capability} | ${s.status} | ${s.source === 'afb' && ['api_key_missing', 'api_auth_required'].includes(s.code) ? 'AFB_API_KEY Secretを公式API設定と照合（Cookie再ログインは不要）' : s.code === 'auth_required' || s.code === 'session_missing' ? `認証プロファイル手順書で${s.source}の認証を復旧し bootstrap-session.mjs ${s.source}${s.source === 'gsc' ? ' --from-profile' : ''} --publish` : s.code ?? s.remaining ?? 'なし'} |`),
  '', 'KDPは昨日の書籍別注文・KENP・電子書籍ロイヤリティ見積りと月次ロイヤリティを分離して取得する。月次を週次へ按分せず、入金・税引後純利益にはしない。afbは発生日/確定日を分けた28日成果で、両系列を足さず、報酬を純収益・入金にしない。提携状態は別の手動経路。ココナラ表示数は有料機能で欠測の場合null。',
];
writeFileSync('/tmp/authenticated-measurement-summary.md', lines.join('\n') + '\n');
console.log(JSON.stringify({ status: state.status, passed: sources.filter(s => s.status === 'pass').length, total: sources.length }));
