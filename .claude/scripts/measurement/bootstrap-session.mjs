#!/usr/bin/env node
/** Export only a named service's dedicated session to a private local file for collect.mjs; never to stdout or off this machine. */
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { createInterface } from 'node:readline/promises';
import { sourceFor, scopedState } from './sources.mjs';
import { openKdpReports } from './kdp-reports.mjs';
import { assertClosedNativeProfile } from './native-profile.mjs';

const [sourceName, ...args] = process.argv.slice(2);
if (!sourceName || args.includes('--help')) {
  console.log('Usage: bootstrap-session.mjs SOURCE [--root PATH] [--from-profile | --login] [--reports]\nExports a dedicated profile/state to .local/authenticated-measurement/SOURCE.bootstrap. --login opens a dedicated browser for HUMAN login. --reports selects the KDP Reports login (KDP only).');
  process.exit(0);
}
const source = sourceFor(sourceName);
if (args.includes('--reports') && (sourceName !== 'kdp' || !args.includes('--login'))) throw new Error('reports_requires_kdp_login');
// 自動操作のブラウザ (Playwright) を拒否するサービスは、普通の Chrome で専用プロファイルにログインし、閉じてから取り出す。
// Google (gsc)
const NATIVE_PROFILE_SOURCES = new Set(['gsc']);
if (sourceName === 'gsc' && args.includes('--login')) throw new Error('google_login_requires_native_chrome: run google-admin/cli.mjs login, close that Chrome, then export with --from-profile');
const rootArg = args.indexOf('--root');
const root = resolve(rootArg < 0 ? process.cwd() : args[rootArg + 1]);
const privateDir = join(root, '.local/authenticated-measurement');
mkdirSync(privateDir, { recursive: true, mode: 0o700 });
const keyFile = join(privateDir, 'vault-key');
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { encoding: 'utf8' }).trim();
if (repo !== 'uruhayato373/stats47') throw new Error('unexpected_repository');
// 保管庫の鍵の正本は最初に作った端末の鍵ファイル。CI が復元 (restore.mjs) に使う Secret が既にあるのに鍵ファイルが無い端末では、
// 別の鍵を作らずに止める。Secrets は名前の一覧を読むだけで、書かない。
const existingSecrets = JSON.parse(execFileSync('gh', ['secret', 'list', '--repo', repo, '--json', 'name'], { encoding: 'utf8' }));
if (!existsSync(keyFile)) {
  if (existingSecrets.some(s => s.name === 'MEASUREMENT_VAULT_KEY')) throw new Error('vault_key_already_exists: use its original bootstrap machine; do not rotate blindly');
  writeFileSync(keyFile, randomBytes(32).toString('hex'), { mode: 0o600 });
}
let state;
const stateFile = source.state && join(root, '.local', source.state);
if (stateFile && existsSync(stateFile) && !args.includes('--from-profile') && !args.includes('--login')) state = JSON.parse(readFileSync(stateFile, 'utf8'));
else {
  const profile = join(root, '.local', source.profile);
  const login = args.includes('--login');
  if (!existsSync(profile) && !login) throw new Error('session_missing');
  if (login && !process.stdin.isTTY) throw new Error('login_requires_interactive_terminal');
  // A normal Chrome profile uses the OS keychain, unlike Playwright's test profile.
  // Export from a disposable copy: opening with incompatible defaults must never
  // discard the user's original encrypted cookies.
  const nativeProfile = NATIVE_PROFILE_SOURCES.has(sourceName);
  if (nativeProfile) assertClosedNativeProfile(profile);
  const temporaryProfile = nativeProfile ? mkdtempSync(join(tmpdir(), 'stats47-measurement-profile-')) : null;
  let context;
  try {
    if (temporaryProfile) cpSync(profile, temporaryProfile, { recursive: true,
      filter: path => !/(?:^|\/)(?:Singleton[^/]*|Cache|Code Cache|GPUCache|Crashpad)(?:\/|$)/.test(path) });
    context = await chromium.launchPersistentContext(temporaryProfile ?? profile, {
      channel: 'chrome', headless: !login,
      ...(nativeProfile ? { ignoreDefaultArgs: ['--password-store=basic', '--use-mock-keychain'] } : {}),
    });
    if (login) {
      const urls = { a8: 'https://pub.a8.net/',
        note: 'https://note.com/settings/account', gsc: 'https://search.google.com/search-console?resource_id=sc-domain%3Astats47.jp',
        kdp: 'https://kdp.amazon.co.jp/ja_JP/bookshelf',
        rakuten: 'https://affiliate.rakuten.co.jp/report/summary' };
      const page = context.pages()[0] || await context.newPage();
      await page.goto(args.includes('--reports') ? 'https://kdpreports.amazon.co.jp/' : urls[sourceName], { waitUntil: 'domcontentloaded', timeout: 60000 });
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      try { await prompt.question('専用ブラウザで対象アカウントへのログイン・2FAを完了後、Enterを押してください（10分以内）。パスワードをここへ入力しないでください。', { signal: AbortSignal.timeout(600000) }); }
      finally { prompt.close(); }
      // Enter acknowledges the human step; it is not evidence of Reports access.
      if (args.includes('--reports')) await openKdpReports(page);
    }
    state = await context.storageState({ indexedDB: true });
    if (login && stateFile) writeFileSync(stateFile, JSON.stringify(scopedState(sourceName, state)), { mode: 0o600 });
  }
  finally {
    try { await context?.close(); }
    finally { if (temporaryProfile) rmSync(temporaryProfile, { recursive: true, force: true }); }
  }
}
const bundle = { schemaVersion: 1, source: sourceName, capturedAt: new Date().toISOString(), state: scopedState(sourceName, state) };
if (sourceName === 'kdp') {
  const account = JSON.parse(readFileSync(join(root, '.local/kdp-account.local.json'), 'utf8'));
  if (!/^B0[A-Z0-9]{8}$/.test(account.knownAsin ?? '')) throw new Error('account_mismatch');
  bundle.account = { knownAsin: account.knownAsin };
}
const encoded = gzipSync(Buffer.from(JSON.stringify(bundle))).toString('base64');
writeFileSync(join(privateDir, `${sourceName}.bootstrap`), encoded, { mode: 0o600 });
console.log(JSON.stringify({ source: sourceName, cookies: bundle.state.cookies.length, bytes: Buffer.byteLength(encoded) }));
