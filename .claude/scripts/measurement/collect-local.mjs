#!/usr/bin/env node
/**
 * collect-local.mjs — 認証付き計測を Mac で直接取得する入口 (2026-10-19。GitHub Actions の
 * authenticated-measurement.yml の collect + record の summarize 段に当たる)。
 *
 * 取得元ごとに、Mac の専用プロファイルからセッションを取り出し (bootstrap-session.mjs。Secrets へは送らない)、
 * collect.mjs --local --vault で取得して証跡を private R2 の保管庫へ書き、最後に summarize.mjs で
 * data/authenticated/{latest,revenue-history}.json と販売台帳を更新する。git への記録は呼び元
 * (scripts/scheduled/measurement-collect-local.sh) が定期実行専用の clone で行う。
 *
 * プロファイル・.env.local (R2 の S3 資格情報・AFB_API_KEY)・保管庫の鍵は、対話の作業フォルダ (--main-root) のものを使う。
 * この clone の .local には置かない。
 *
 * Usage: node .claude/scripts/measurement/collect-local.mjs --main-root <作業フォルダ> [取得元...]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { SOURCES } from './sources.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const mainIndex = args.indexOf('--main-root');
const MAIN_ROOT = resolve(mainIndex < 0 ? ROOT : args[mainIndex + 1]);
const selected = args.filter((a, i) => !a.startsWith('--') && (mainIndex < 0 || i !== mainIndex + 1));
const unknown = selected.filter(name => !Object.hasOwn(SOURCES, name));
if (unknown.length) throw new Error(`unknown_source: ${unknown.join(',')}`);
const names = selected.length ? selected : Object.keys(SOURCES);

config({ path: join(MAIN_ROOT, '.env.local'), quiet: true });
const keyFile = join(MAIN_ROOT, '.local/authenticated-measurement/vault-key');
if (!process.env.MEASUREMENT_VAULT_KEY && existsSync(keyFile)) process.env.MEASUREMENT_VAULT_KEY = readFileSync(keyFile, 'utf8').trim();
for (const key of ['MEASUREMENT_VAULT_KEY', 'R2_S3_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) {
  if (!process.env[key]) throw new Error(`env_missing: ${key}`);
}

// summarize.mjs は実行番号で今回の結果だけを選ぶ (CI の GITHUB_RUN_ID と同じ役割)。
const runId = String(Date.now());
// 保管庫への書き込みは CI と Mac の定期実行だけに許す (vault.mjs)
const env = { ...process.env, GITHUB_RUN_ID: runId, GITHUB_RUN_ATTEMPT: '1', MEASUREMENT_VAULT_WRITER: 'mac' };
const publicDir = join(ROOT, '.local/authenticated-ci-public');
rmSync(publicDir, { recursive: true, force: true });

const node = (script, scriptArgs, timeout) => spawnSync(process.execPath, [script, ...scriptArgs],
  { cwd: ROOT, env, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 });
const lastLine = text => String(text ?? '').trim().split('\n').pop();

for (const name of names) {
  const source = SOURCES[name];
  const collectArgs = [name, '--local', '--vault'];
  if (source.transport !== 'api') {
    // 取り出せなければ collect.mjs を動かさない。summarize.mjs が「結果なし」として失敗に数える。
    const boot = node('.claude/scripts/measurement/bootstrap-session.mjs', [name, '--root', MAIN_ROOT], 180000);
    if (boot.status !== 0) {
      console.log(JSON.stringify({ source: name, status: 'failed', step: 'bootstrap', message: lastLine(boot.stderr) }));
      continue;
    }
    collectArgs.push('--bootstrap', join(MAIN_ROOT, '.local/authenticated-measurement', `${name}.bootstrap`));
  }
  const collected = node('.claude/scripts/measurement/collect.mjs', collectArgs, 1800000);
  console.log(lastLine(collected.stdout) || JSON.stringify({ source: name, status: 'failed', step: 'collect', exit: collected.status }));
}

execFileSync(process.execPath, ['.claude/scripts/measurement/summarize.mjs'], { cwd: ROOT, env, stdio: 'inherit' });
