#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { SOURCES } from './sources.mjs';

const input = process.argv[2] || '.local/authenticated-ci-public';
const output = '.claude/state/metrics/authenticated/latest.json';
const previous = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : { sources: [] };
const sources = Object.entries(SOURCES).map(([source, config]) => {
  const path = join(input, `${source}.json`);
  const value = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  return { source, capability: config.capability, observedAt: value.observedAt ?? null,
    activated: value.status === 'pass' || previous.sources?.some(s => s.source === source && s.activated === true) || false,
    status: value.status === 'pass' ? 'pass' : 'failed', code: value.code ?? (value.status === 'pass' ? null : 'runner_failed'),
    runId: value.runId ?? process.env.GITHUB_RUN_ID ?? null,
    metricsAvailable: value.status === 'pass' && value.metricsAvailable === true,
    evidence: value.evidence ?? null,
    quality: value.quality ?? null,
    remaining: source === 'kdp' ? 'sales_report_adapter_required' : source === 'afb' ? 'outcomes_not_collected' : null,
  };
});
const state = { schemaVersion: 1, generatedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID ?? null, sources,
  status: sources.every(s => s.status === 'pass') ? 'pass' : 'action_required' };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(state, null, 2) + '\n');
const lines = ['認証付き計測の最新試行。生データと認証状態は暗号化したprivate R2に保存。', '',
  '| 対象 | 収集範囲 | 状態 | 次の操作 |', '|---|---|---|---|',
  ...sources.map(s => `| ${s.source} | ${s.capability} | ${s.status} | ${s.code === 'auth_required' || s.code === 'session_missing' ? `専用profileで再ログイン後 bootstrap-session.mjs ${s.source} --publish` : s.code ?? s.remaining ?? 'なし'} |`),
  '', 'KDP売上・afb成果は未取得。出版/提携状態の成功を成果計測完了とは扱わない。ココナラ表示数は有料機能で欠測の場合null。',
];
writeFileSync('/tmp/authenticated-measurement-summary.md', lines.join('\n') + '\n');
console.log(JSON.stringify({ status: state.status, passed: sources.filter(s => s.status === 'pass').length, total: sources.length }));
