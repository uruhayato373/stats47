#!/usr/bin/env node
/**
 * credential-status.mjs — 資格情報の登録状況 (この PC の有無と ID・CI の Secrets 名) を調べ、管理画面が読むファイルへ書く。
 * 管理画面は読み取り専用で子プロセスを起動しないため、OS の資格情報ストアと gh はここで読む (`npm run admin` の前に自動実行)。
 * パスワードは読まない。出力は .local (git 管理外)。
 *
 * Usage: node .claude/scripts/measurement/credential-status.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { credentialServices, storedAccounts } from './credential-store.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const STATUS_PATH = '.local/authenticated-measurement/credential-status.json';

const services = credentialServices();
const local = storedAccounts(Object.values(services).map((s) => s.storeItem));
let ciSecrets = null;
try {
  const out = execFileSync('gh', ['secret', 'list', '--repo', 'uruhayato373/stats47', '--json', 'name'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  ciSecrets = JSON.parse(out).map((s) => s.name).filter((n) => n.startsWith('STATS47_AUTH_'));
} catch { /* gh 未ログイン等は「確認不可」として表示する */ }

const target = join(ROOT, STATUS_PATH);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify({ generatedAt: new Date().toISOString(), platform: process.platform, local, ciSecrets }, null, 2) + '\n');
const stored = local ? Object.values(local).filter((v) => v.stored).length : null;
console.log(`[credential-status] この PC: ${stored ?? '未対応 OS'}/${Object.keys(services).length} 登録 / CI Secrets: ${ciSecrets ? ciSecrets.length : '確認不可'}`);
