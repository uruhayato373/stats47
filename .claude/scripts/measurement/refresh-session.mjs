#!/usr/bin/env node
/**
 * refresh-session.mjs — A8 / もしも の専用プロファイルのログインを Mac 上で保ち、CI へ渡す。
 *
 * 流れ: 専用プロファイルで管理画面を開く → 切れていれば macOS キーチェーンの ID/PW で 1 回だけ
 * ログインする → state を保存 → `bootstrap-session.mjs SOURCE --publish` で CI の Secret を更新する。
 * 新しい世代の Secret は auth-recovery.mjs の停止 (拒否済み世代) を解除する。
 *
 * state は stats47 と doboku-note で共用する。`.local/playwright-{a8,moshimo}-state.json` は
 * `~/.local/share/asp-sessions/` への symlink (docs/01_技術設計/07_Playwright認証プロファイル.md)。
 *
 * 守ること:
 *   - ID/PW はキーチェーンからだけ読む。ログ・引数・ファイルへ出さない
 *   - 2FA / CAPTCHA / 追加確認は突破しない。human_required で止めて通知する
 *   - ログイン失敗は 1 回で止め、失敗印を残して以後の自動試行をしない (アカウントロック回避)。
 *     人が確認して失敗印を消すまで再試行しない
 *
 * キーチェーン登録 (オーナーが 1 回だけ。-w を値なしで付けるとパスワードを対話入力できる):
 *   security add-generic-password -s stats47-measurement-a8 -a <ログインID> -w
 *   security add-generic-password -s stats47-measurement-moshimo -a <ログインID> -w
 *
 * Usage: refresh-session.mjs SOURCE... [--publish] [--headed] [--wait-human]
 *   --wait-human: キーチェーンを使わず、開いたブラウザで人がログインするのを最大 10 分待つ
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scopedState } from './sources.mjs';

export const LOGIN = {
  a8: {
    loginUrl: 'https://www.a8.net/',
    checkUrl: 'https://media-console.a8.net/home',
    user: 'form[name=asLogin] input[name=login]',
    password: 'form[name=asLogin] input[name=passwd]',
    submit: 'form[name=asLogin] input[name=login_as_btn]',
    loggedIn: (url) => /media-console\.a8\.net/.test(url) && !/re-authentication|\/login/i.test(url),
  },
  moshimo: {
    loginUrl: 'https://af.moshimo.com/af/shop/login',
    checkUrl: 'https://af.moshimo.com/af/shop/index',
    user: '#login-form input[name=account]',
    password: '#login-form input[name=password]',
    submit: '#login-form input[name=login]',
    loggedIn: (url) => /af\.moshimo\.com\/af\/shop\//.test(url) && !/\/login|signin/i.test(url),
  },
};

/** ログイン試行後の画面を分類する。ok / human_required / login_failed の 3 値。 */
export function classifyLoginOutcome(source, { url, hasPassword, hasChallenge }) {
  if (LOGIN[source].loggedIn(url) && !hasPassword) return 'ok';
  if (hasChallenge) return 'human_required';
  return 'login_failed';
}

/** `security find-generic-password` の属性出力からアカウント名を取り出す。 */
export function parseKeychainAccount(text) {
  const m = /"acct"<blob>="([^"]*)"/.exec(text);
  return m ? m[1] : null;
}

function keychainCredential(source) {
  const service = `stats47-measurement-${source}`;
  const run = (extra) => execFileSync('security', ['find-generic-password', '-s', service, ...extra],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const user = parseKeychainAccount(run([]));
    const password = run(['-w']).replace(/\n$/, '');
    return user && password ? { user, password } : null;
  } catch { return null; }
}

function notify(message) {
  try { execFileSync('osascript', ['-e', `display notification ${JSON.stringify(message)} with title "stats47 計測ログイン"`]); } catch { /* 通知は補助 */ }
}

async function pageSignals(page) {
  return page.evaluate(() => {
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const hasPassword = [...document.querySelectorAll('input[type=password]')].some(visible);
    const text = document.body?.innerText ?? '';
    const hasChallenge = !!document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"]')
      || /認証コード|ワンタイム|確認コード|私はロボットではありません|画像認証/.test(text);
    return { hasPassword, hasChallenge };
  }).catch(() => ({ hasPassword: true, hasChallenge: false }));
}

async function refresh(source, { root, publish, headed, waitHuman }) {
  const { chromium } = await import('playwright');
  const conf = LOGIN[source];
  const privateDir = join(root, '.local/authenticated-measurement');
  mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  const failMark = join(privateDir, `${source}.autologin-failed`);
  if (existsSync(failMark)) return { source, status: 'blocked', reason: `前回の自動ログインが失敗したため停止中。確認後に ${failMark} を削除する` };

  const context = await chromium.launchPersistentContext(join(root, '.local', `playwright-${source}-profile`), {
    channel: 'chrome', headless: !(headed || waitHuman), locale: 'ja-JP', timezoneId: 'Asia/Tokyo',
  });
  let loggedInBy = 'session';
  try {
    const statePath = join(root, '.local', `playwright-${source}-state.json`);
    if (existsSync(statePath)) {
      const saved = JSON.parse(readFileSync(statePath, 'utf8'));
      if (Array.isArray(saved.cookies) && saved.cookies.length) await context.addCookies(saved.cookies).catch(() => {});
    }
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto(conf.checkUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const before = await pageSignals(page);
    if (!(conf.loggedIn(page.url()) && !before.hasPassword)) {
      const cred = waitHuman ? null : keychainCredential(source);
      if (!cred && waitHuman) {
        // 人がこのブラウザでログインするのを待つ (自動入力しない)。
        loggedInBy = 'human';
        await page.goto(conf.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
        const deadline = Date.now() + 600000;
        let ok = false;
        while (Date.now() < deadline && !ok) {
          await page.waitForTimeout(3000);
          ok = conf.loggedIn(page.url()) && !(await pageSignals(page)).hasPassword;
        }
        if (!ok) return { source, status: 'human_timeout', reason: '10 分以内にログインを検知できなかった' };
      }
      if (!cred && !waitHuman) return { source, status: 'no_credential', reason: `キーチェーンに stats47-measurement-${source} がない` };
      if (cred) {
      loggedInBy = 'keychain';
      await page.goto(conf.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.fill(conf.user, cred.user);
      await page.fill(conf.password, cred.password);
      await page.click(conf.submit);
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(5000);
      const status = classifyLoginOutcome(source, { url: page.url(), ...(await pageSignals(page)) });
      if (status !== 'ok') {
        writeFileSync(failMark, `${new Date().toISOString()} ${status}\n`, { mode: 0o600 });
        return { source, status, reason: status === 'human_required' ? '2FA/CAPTCHA 等の人の確認が必要' : 'ID/PW が通らなかった (キーチェーンの値を確認)' };
      }
      }
    }
    writeFileSync(statePath, JSON.stringify(scopedState(source, await context.storageState({ indexedDB: true }))), { mode: 0o600 });
  } finally {
    await context.close();
  }
  if (publish) {
    execFileSync(process.execPath, [join(root, '.claude/scripts/measurement/bootstrap-session.mjs'), source, '--root', root, '--publish'],
      { stdio: ['ignore', 'pipe', 'inherit'] });
  }
  return { source, status: 'ok', loggedInBy, published: publish };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const sources = args.filter((a) => !a.startsWith('--'));
  if (!sources.length || args.includes('--help')) {
    console.log('Usage: refresh-session.mjs SOURCE... [--publish] [--headed] [--wait-human]  (SOURCE: a8 | moshimo)');
    process.exit(0);
  }
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  let failed = false;
  for (const source of sources) {
    if (!LOGIN[source]) throw new Error(`unsupported_source: ${source}`);
    const result = await refresh(source, { root, publish: args.includes('--publish'), headed: args.includes('--headed'), waitHuman: args.includes('--wait-human') })
      .catch((e) => ({ source, status: 'error', reason: String(e.message).slice(0, 160) }));
    console.log(JSON.stringify(result));
    if (result.status !== 'ok') {
      failed = true;
      notify(`${source}: ${result.status} — ${result.reason ?? ''}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
