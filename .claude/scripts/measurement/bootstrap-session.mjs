#!/usr/bin/env node
/** Export only a named service's dedicated session; send through gh stdin, never stdout. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { createInterface } from 'node:readline/promises';
import { sourceFor, scopedState } from './sources.mjs';

const [sourceName, ...args] = process.argv.slice(2);
if (!sourceName || args.includes('--help')) {
  console.log('Usage: bootstrap-session.mjs SOURCE [--root PATH] [--from-profile | --login] [--publish]\nExports a dedicated profile/state. --login opens a dedicated browser for HUMAN login. --publish installs repository Secrets through stdin.');
  process.exit(0);
}
const source = sourceFor(sourceName);
const rootArg = args.indexOf('--root');
const root = resolve(rootArg < 0 ? process.cwd() : args[rootArg + 1]);
const publish = args.includes('--publish');
const privateDir = join(root, '.local/authenticated-measurement');
mkdirSync(privateDir, { recursive: true, mode: 0o700 });
const keyFile = join(privateDir, 'vault-key');
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { encoding: 'utf8' }).trim();
if (repo !== 'uruhayato373/stats47') throw new Error('unexpected_repository');
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
  const context = await chromium.launchPersistentContext(profile, { channel: 'chrome', headless: !login });
  try {
    if (login) {
      const urls = { a8: 'https://pub.a8.net/', moshimo: 'https://af.moshimo.com/af/shop', afb: 'https://www.afi-b.com/pa/',
        note: 'https://note.com/settings/account', gsc: 'https://search.google.com/search-console?resource_id=sc-domain%3Astats47.jp',
        kdp: 'https://kdp.amazon.co.jp/ja_JP/bookshelf', coconala: 'https://coconala.com/mypage/dashboard' };
      const page = context.pages()[0] || await context.newPage();
      await page.goto(urls[sourceName], { waitUntil: 'domcontentloaded', timeout: 60000 });
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      try { await prompt.question('専用ブラウザで対象アカウントへのログイン・2FAを完了後、Enterを押してください（10分以内）。パスワードをここへ入力しないでください。', { signal: AbortSignal.timeout(600000) }); }
      finally { prompt.close(); }
    }
    state = await context.storageState({ indexedDB: true });
    if (login && stateFile) writeFileSync(stateFile, JSON.stringify(scopedState(sourceName, state)), { mode: 0o600 });
  }
  finally { await context.close(); }
}
const bundle = { schemaVersion: 1, source: sourceName, capturedAt: new Date().toISOString(), state: scopedState(sourceName, state) };
if (sourceName === 'kdp') {
  const account = JSON.parse(readFileSync(join(root, '.local/kdp-account.local.json'), 'utf8'));
  if (!/^B0[A-Z0-9]{8}$/.test(account.knownAsin ?? '')) throw new Error('account_mismatch');
  bundle.account = { knownAsin: account.knownAsin };
}
const encoded = gzipSync(Buffer.from(JSON.stringify(bundle))).toString('base64');
if (Buffer.byteLength(encoded) > 47000) throw new Error('session_exceeds_github_secret_limit');
writeFileSync(join(privateDir, `${sourceName}.bootstrap`), encoded, { mode: 0o600 });
if (publish) {
  if (!existingSecrets.some(s => s.name === 'MEASUREMENT_VAULT_KEY')) {
    execFileSync('gh', ['secret', 'set', 'MEASUREMENT_VAULT_KEY', '--repo', repo], { input: readFileSync(keyFile), stdio: ['pipe', 'pipe', 'pipe'] });
  }
  execFileSync('gh', ['secret', 'set', source.secret, '--repo', repo], { input: encoded, stdio: ['pipe', 'pipe', 'pipe'] });
}
console.log(JSON.stringify({ source: sourceName, secret: source.secret, configured: publish, cookies: bundle.state.cookies.length, bytes: Buffer.byteLength(encoded) }));
