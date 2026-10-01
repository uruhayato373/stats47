#!/usr/bin/env node
/**
 * refresh-session.mjs — A8 / もしも / KDP / note の専用プロファイルのログインを Mac 上で保ち、CI へ渡す。
 *
 * 流れ: 専用プロファイルで管理画面を開く → 切れていれば OS の資格情報ストア (Mac = キーチェーン、Windows = 資格情報
 * マネージャー。`credential-store.mjs`) の ID/PW で 1 回だけログインする → state を保存 → `bootstrap-session.mjs SOURCE --publish` で CI の Secret を更新する。
 * 新しい世代の Secret は auth-recovery.mjs の停止 (拒否済み世代) を解除する。
 *
 * state は stats47 と doboku-note で共用する。`.local/playwright-{a8,moshimo}-state.json` は
 * `~/.local/share/asp-sessions/` への symlink (docs/01_技術設計/07_Playwright認証プロファイル.md)。
 *
 * 守ること:
 *   - ID/PW は `credential-store.mjs` からだけ読む。ログ・引数・ファイルへ出さない
 *   - CAPTCHA / 追加確認は突破しない。human_required で止めて通知する。2FA は認証アプリ方式 (TOTP) の秘密鍵が
 *     `stats47-measurement-<source>-totp` に登録されている場合だけ、コードを計算して入力する (本人口座の正規の 2FA)
 *   - ログイン失敗は 1 回で止め、失敗印を残して以後の自動試行をしない (アカウントロック回避)。
 *     人が確認して失敗印を消すまで再試行しない
 *
 * 登録 (オーナーが各マシンで 1 回だけ。Windows の cmdkey と TOTP の登録は `credential-store.mjs` の冒頭):
 *   security add-generic-password -s stats47-measurement-a8 -a <ログインID> -w
 *   security add-generic-password -s stats47-measurement-moshimo -a <ログインID> -w
 *   security add-generic-password -s stats47-measurement-kdp -a <Amazon のメールアドレス> -w
 *   security add-generic-password -s stats47-measurement-note -a <note のメールアドレス> -w
 *   security add-generic-password -s stats47-measurement-x -a <X のユーザー名 (stats47jp373)> -w
 *
 * KDP (2026-09-27 オーナー承認で追加): Amazon は「メール → 次へ → パスワード」の 2 段階画面で、本棚と
 * Reports (kdpreports.amazon.co.jp) の認証が別。本棚 → 既知 ASIN で口座照合 → Reports の順に通し、
 * どこかで 2FA (/ap/mfa)・追加確認 (/ap/cvf)・CAPTCHA が出たら human_required で止める。
 * 「ログインしたままにする」を付けて 2FA の再要求を減らす。2FA が毎回出る口座では自動化できない。
 *
 * Usage: refresh-session.mjs SOURCE... [--publish] [--headed] [--wait-human]
 *   --wait-human: 資格情報ストアを使わず、開いたブラウザで人がログインするのを最大 10 分待つ
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scopedState } from './sources.mjs';
import { readCredential, totpCode } from './credential-store.mjs';

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
  // note (2026-09-30): ログイン自体は長期セッションで保たれる。売上 API はパスワードの再確認を通した
  // セッションでだけ答え、再確認は約 30 分で切れるので、CI の収集を起動する直前に毎回ここで通す。
  // 再確認画面はパスワード欄だけ (ID 欄が無い) なので user は存在しないセレクタにして入力を飛ばす。
  // ログイン自体が切れていたら (パスワードとメールの両方を求められる) human_required で止まる。
  note: {
    loginUrl: 'https://note.com/dashboard/salesmanage',
    checkUrl: 'https://note.com/dashboard/salesmanage',
    user: 'input[name=__stats47_no_user_field__]',
    password: 'input[type=password]',
    submit: 'button:has-text("確認して続ける")',
    loggedIn: (url) => /note\.com\/dashboard\/salesmanage/.test(url),
    challengeUrl: /note\.com\/login/,
    // CI (--ci) はセッション自体の切れを通常のログイン画面で入り直す。セレクタは doboku-note が 2026-09-28 に DOM で確認したもの
    ci: {
      loginUrl: 'https://note.com/login',
      checkUrl: 'https://note.com/dashboard',
      user: 'input[name=login]',
      password: 'input[name=password]',
      submit: 'button[type=submit]',
      loggedIn: (url) => /^https:\/\/(editor\.)?note\.com\//.test(url) && !/\/login|\/signup/.test(url),
    },
  },
  // 楽天アフィリエイト (2026-10-01 追加): 楽天 ID の SSO。ID → 次へ (#cta001) → パスワード → 次へ/ログイン の 2 段階。
  // ID 画面は 2026-10-01 に公開画面で確認。パスワード画面のボタンは ID を入れないと出ないため未確認で、
  // 「次へ」「ログイン」の文字で押す。外れたら login_failed で止まり失敗印が残る (再試行しない)。
  // 追加確認 (メールのコード等) は突破せず human_required。
  rakuten: {
    loginUrl: 'https://login.account.rakuten.com/sso/authorize?client_id=affiliate_jp_web&redirect_uri=https://affiliate.rakuten.co.jp/auth/callback&response_type=code&scope=openid%20profile&r10_required_claims=r10_name&ui_locales=ja-JP&state=https%3A%2F%2Faffiliate.rakuten.co.jp%2Freport%2Fsummary',
    checkUrl: 'https://affiliate.rakuten.co.jp/report/summary',
    user: '#user_id',
    next: '#cta001',
    password: 'input[type=password]',
    submit: '[id^="cta"]:has-text("次へ"), [id^="cta"]:has-text("ログイン")',
    // パスワード画面の送信ボタンが上のセレクタに一致せず click が 30 秒で時間切れになった (2026-10-01 Mac 実機)。
    // パスワード欄で Enter を押して送信する
    submitByEnter: true,
    bundledChromium: true,
    loggedIn: (url) => /^https:\/\/affiliate\.rakuten\.co\.jp\/report/.test(url),
  },
  // ココナラは 2026-10-02 に自動ログインの対象から外した (自動操作のブラウザを見えない reCAPTCHA が拒否する)。
  // セッションが切れたら普通の Chrome でログインし bootstrap-session.mjs coconala --from-profile --publish (正本 auth-credentials.json)
  // X (2026-09-30 オーナー判断で追加): 予約投稿 (publish-x) の専用プロファイルのログインを保つ。
  // publish-x は Playwright 同梱の Chromium でこのプロファイルを開くので、ここも同じブラウザで開く
  // (Chrome 本体で開くと Cookie の暗号化方式が変わりログインが壊れうる)。X の投稿は Mac だけなので state は CI へ渡さない。
  // ユーザー名の後に「電話番号またはユーザー名」の追加確認が出たら突破せず human_required で止める。
  x: {
    loginUrl: 'https://x.com/i/flow/login',
    checkUrl: 'https://x.com/home',
    user: 'input[autocomplete="username"]',
    next: 'button:has-text("次へ")',
    password: 'input[name="password"]',
    submit: '[data-testid="LoginForm_Login_Button"]',
    headed: true, // X は headless を bot とみなしやすい
    bundledChromium: true,
    localOnly: true,
    loggedIn: (url) => /^https:\/\/(x|twitter)\.com\/home/.test(url),
    challengeUrl: /\/account\/access|\/i\/flow\/(login|two-factor)/,
    challengeSelector: 'input[data-testid="ocfEnterTextTextInput"]',
  },
  kdp: {
    loginUrl: 'https://kdp.amazon.co.jp/ja_JP/bookshelf',
    checkUrl: 'https://kdp.amazon.co.jp/ja_JP/bookshelf',
    user: 'input[name=email]',
    next: 'input#continue',
    password: 'input[name=password]',
    remember: 'input[name=rememberMe]',
    submit: 'input#signInSubmit',
    headed: true, // Amazon は headless を bot とみなして CAPTCHA を出しやすい
    loggedIn: (url) => /kdp\.amazon\.co\.jp\//.test(url) && !/\/ap\/(signin|mfa|cvf)/.test(url),
    challengeUrl: /\/ap\/(mfa|cvf)|\/errors\/validateCaptcha/,
    // 認証アプリ方式の 2FA 画面。セレクタは Amazon の一般的な MFA フォーム (実機では未確認。外れたら human_required で止まる)
    otp: { url: /\/ap\/mfa/, input: 'input[name=otpCode]', remember: 'input[name=rememberDevice]', submit: 'input#auth-signin-button' },
  },
};

/** ログイン試行後の画面を分類する。ok / human_required / login_failed の 3 値。 */
export function classifyLoginOutcome(source, { url, hasPassword, hasChallenge }) {
  if (LOGIN[source].loggedIn(url) && !hasPassword) return 'ok';
  if (hasChallenge || LOGIN[source].challengeUrl?.test(url)) return 'human_required';
  return 'login_failed';
}

function notify(message) {
  if (process.platform !== 'darwin') { console.error(`[stats47 計測ログイン] ${message}`); return; }
  try { execFileSync('osascript', ['-e', `display notification ${JSON.stringify(message.replace(/[\u0000-\u001f]+/g, ' ').slice(0, 200))} with title "stats47 計測ログイン"`]); } catch { /* 通知は補助 */ }
}

async function pageSignals(page) {
  return page.evaluate(() => {
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const hasPassword = [...document.querySelectorAll('input[type=password]')].some(visible);
    const text = document.body?.innerText ?? '';
    // 見えない reCAPTCHA (size=invisible・右下のバッジ) はログイン画面に常に置かれるので確認画面に数えない。
    // ココナラで、ログインが通らず画面に留まると必ず human_required になり、止まった本当の理由が見えなかった (2026-10-02)
    const hasChallenge = [...document.querySelectorAll('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"]')]
      .some((frame) => !/[?&]size=invisible\b/.test(frame.getAttribute('src') || ''))
      || /認証コード|ワンタイム|確認コード|私はロボットではありません|画像認証|2段階認証|文字を入力してください/.test(text);
    return { hasPassword, hasChallenge };
  }).catch(() => ({ hasPassword: true, hasChallenge: false }));
}

/**
 * ID/PW を入れて送信する。1 画面 (A8・もしも) と、メール → 次へ → パスワードの 2 段階 (Amazon) の両方に対応する。
 * 入力欄が見えないときは入れない (Reports 側で「パスワードだけ」を求められる場合がある)。
 */
async function submitCredential(page, conf, cred) {
  const visible = (sel) => page.locator(sel).first().isVisible().catch(() => false);
  if (await visible(conf.user)) {
    await page.fill(conf.user, cred.user);
    if (conf.next && await visible(conf.next)) {
      await page.click(conf.next);
      await page.waitForSelector(conf.password, { state: 'visible', timeout: 30000 }).catch(() => {});
    }
  }
  if (!(await visible(conf.password))) return;
  await page.fill(conf.password, cred.password);
  if (conf.remember && await visible(conf.remember)) await page.check(conf.remember).catch(() => {});
  if (conf.submitByEnter) await page.press(conf.password, 'Enter');
  else await page.click(conf.submit);
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000);
}

/**
 * 送信後の着地ページがログイン済みの形でなければ、checkUrl を 1 回開き直す。SSO の戻り先がトップ等で、
 * ログインできているのに login_failed と判定された (2026-10-01 楽天 Mac 実機)。未ログインなら checkUrl が
 * ログイン画面へ戻すので失敗は失敗のまま残る。2FA/CAPTCHA の画面は開き直さない (human_required を保つ)。
 */
async function settleOnCheckUrl(page, conf) {
  if (conf.loggedIn(page.url()) || conf.challengeUrl?.test(page.url())) return;
  if ((await pageSignals(page)).hasChallenge) return;
  await page.goto(conf.checkUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

/** 画面が認証アプリの 2FA のときだけ、TOTP を計算して 1 回入力する。入力できなければ何もしない (呼び側が human_required で止める)。 */
export async function passTotpIfOffered(page, conf, cred) {
  if (!conf.otp || !cred?.totpSecret || !conf.otp.url.test(page.url())) return false;
  const input = page.locator(conf.otp.input).first();
  if (!(await input.isVisible().catch(() => false))) return false;
  await input.fill(totpCode(cred.totpSecret));
  if (conf.otp.remember) await page.locator(conf.otp.remember).first().check().catch(() => {});
  await page.click(conf.otp.submit).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000);
  return true;
}

/**
 * KDP だけの後段: 既知 ASIN で口座を照合し (別口座のセッションを CI へ渡さない)、Reports の認証も通す。
 * Reports で再ログインを求められたら同じ資格情報で 1 回だけ送信し、それでも通らなければ止める。
 */
async function afterKdpLogin(page, cred) {
  const { assertAccount } = await import('../kdp/lib/kdp-session.mjs');
  const account = await assertAccount(page, { tag: '[refresh-session kdp]' });
  if (!account.ok) return { status: 'account_mismatch', reason: account.reason };
  const { openKdpReports } = await import('./kdp-reports.mjs');
  try {
    await openKdpReports(page);
    return { status: 'ok' };
  } catch (error) {
    if (!/auth_required/.test(String(error.message)) || !cred) return { status: 'reports_auth_required', reason: 'Reports の認証が必要 (資格情報ストア未登録か --wait-human で人が通す)' };
  }
  await submitCredential(page, LOGIN.kdp, cred);
  await passTotpIfOffered(page, LOGIN.kdp, cred);
  if (LOGIN.kdp.challengeUrl.test(page.url()) || (await pageSignals(page)).hasChallenge) return { status: 'human_required', reason: 'Reports で 2FA/CAPTCHA 等の人の確認が必要' };
  try {
    await openKdpReports(page);
    return { status: 'ok' };
  } catch {
    return { status: 'login_failed', reason: 'Reports の再ログインが通らなかった' };
  }
}

async function refresh(source, { root, publish, headed, waitHuman }) {
  const { chromium } = await import('playwright');
  const conf = LOGIN[source];
  const privateDir = join(root, '.local/authenticated-measurement');
  mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  const failMark = join(privateDir, `${source}.autologin-failed`);
  if (existsSync(failMark)) return { source, status: 'blocked', reason: `前回の自動ログインが失敗したため停止中。確認後に ${failMark} を削除する` };

  const context = await chromium.launchPersistentContext(join(root, '.local', `playwright-${source}-profile`), {
    ...(conf.bundledChromium
      ? { args: ['--disable-blink-features=AutomationControlled'], viewport: { width: 1280, height: 900 } }
      : { channel: 'chrome' }),
    headless: !(headed || waitHuman || conf.headed), locale: 'ja-JP', timezoneId: 'Asia/Tokyo',
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
      const cred = waitHuman ? null : readCredential(source);
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
      if (!cred && !waitHuman) return { source, status: 'no_credential', reason: `資格情報ストアに stats47-measurement-${source} がない` };
      if (cred) {
      loggedInBy = 'credential-store';
      await page.goto(conf.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await submitCredential(page, conf, cred);
      await passTotpIfOffered(page, conf, cred);
      // 送信直後の画面と、画面に出たエラー文を控える。checkUrl を開き直したあとの画面ではログイン画面へ戻されて
      // 送信の結果が写らない (ココナラで、パスワード欄が空の画面しか残らなかった。2026-10-02)
      const afterSubmit = {
        url: page.url().split('?')[0],
        shot: await page.screenshot({ fullPage: true }).catch(() => null),
        errors: await page.evaluate(() => [...document.querySelectorAll('[role=alert], .error, .error-message, [class*="error"], [class*="Error"], .flash, .alert')]
          .map((element) => element.innerText?.trim()).filter(Boolean).slice(0, 5)).catch(() => []),
      };
      await settleOnCheckUrl(page, conf);
      const signals = await pageSignals(page);
      if (conf.challengeSelector && await page.locator(conf.challengeSelector).first().isVisible().catch(() => false)) signals.hasChallenge = true;
      const status = classifyLoginOutcome(source, { url: page.url(), ...signals });
      if (status !== 'ok') {
        writeFileSync(failMark, `${new Date().toISOString()} ${status}\n`, { mode: 0o600 });
        // 止まった画面を残す (パスワード欄は伏せ字で写る)。原因の切り分けに使い、git には入らない (.local)
        const shot = join(privateDir, `${source}-login-${status}.png`);
        if (afterSubmit.shot) writeFileSync(shot, afterSubmit.shot);
        const finalUrl = page.url().split('?')[0];
        return { source, status, url: finalUrl, afterSubmitUrl: afterSubmit.url, pageErrors: afterSubmit.errors, screenshot: shot, reason: status === 'human_required' ? '2FA/CAPTCHA 等の人の確認が必要' : 'ID/PW が通らなかった (資格情報ストアの値を確認)' };
      }
      }
    }
    if (source === 'kdp') {
      const page = context.pages()[0];
      const after = await afterKdpLogin(page, waitHuman ? null : readCredential(source));
      if (after.status !== 'ok') {
        // 口座不一致・2FA・再ログイン失敗は自動で繰り返さない (アカウントロックと別口座の混入を避ける)
        if (after.status !== 'reports_auth_required') writeFileSync(failMark, `${new Date().toISOString()} ${after.status}\n`, { mode: 0o600 });
        return { source, ...after };
      }
    }
    // X のログインは専用プロファイルそのものに残る。CI へ渡す state は作らない
    if (!conf.localOnly) writeFileSync(statePath, JSON.stringify(scopedState(source, await context.storageState({ indexedDB: true }))), { mode: 0o600 });
  } finally {
    await context.close();
  }
  if (publish && !conf.localOnly) {
    execFileSync(process.execPath, [join(root, '.claude/scripts/measurement/bootstrap-session.mjs'), source, '--root', root, '--publish'],
      { stdio: ['ignore', 'pipe', 'inherit'] });
  }
  return { source, status: 'ok', loggedInBy, published: publish };
}

/**
 * CI 専用 (--ci): 復元した state でログイン済みか確かめ、切れていたら Secrets の ID/PW で 1 回だけ入り直す。
 * 入り直せたときだけ outPath へ state を書く (relogged: true)。2FA/CAPTCHA は突破せず human_required を返す。
 * 失敗後の再試行抑止は呼び側 (collect.mjs) が vault の auth-recovery に記録して行う。
 */
export async function ciRelogin(source, { statePath, outPath }) {
  const base = LOGIN[source];
  const conf = { ...base, ...base.ci };
  const cred = readCredential(source);
  if (!cred) return { source, status: 'no_credential' };
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: !conf.headed, args: ['--disable-blink-features=AutomationControlled'] });
  try {
    const context = await browser.newContext({ ...(existsSync(statePath) ? { storageState: statePath } : {}),
      locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(conf.checkUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    if (conf.loggedIn(page.url()) && !(await pageSignals(page)).hasPassword) return { source, status: 'ok', relogged: false };
    await page.goto(conf.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await submitCredential(page, conf, cred);
    await passTotpIfOffered(page, conf, cred);
    await settleOnCheckUrl(page, conf);
    const signals = await pageSignals(page);
    const url = page.url();
    const status = conf.loggedIn(url) && !signals.hasPassword ? 'ok'
      : signals.hasChallenge || conf.challengeUrl?.test(url) ? 'human_required' : 'login_failed';
    if (status !== 'ok') return { source, status };
    if (source === 'kdp') {
      const after = await afterKdpLogin(page, cred);
      if (after.status !== 'ok') return { source, status: after.status };
    }
    writeFileSync(outPath, JSON.stringify(scopedState(source, await context.storageState({ indexedDB: true }))), { mode: 0o600 });
    return { source, status: 'ok', relogged: true };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--ci')) {
  // Usage: refresh-session.mjs SOURCE --ci --state IN --out OUT  (GitHub Actions 専用。出力は固定のコードだけ)
  const args = process.argv.slice(2);
  const source = args[0];
  const valueOf = (flag) => args[args.indexOf(flag) + 1];
  const result = process.env.GITHUB_ACTIONS === 'true' && LOGIN[source]
    ? await ciRelogin(source, { statePath: valueOf('--state'), outPath: valueOf('--out') })
      .catch((e) => ({ source, status: /Timeout/.test(String(e?.message)) ? 'timeout' : 'error' }))
    : { source, status: 'unsupported' };
  console.log(JSON.stringify(result));
  process.exit(result.status === 'ok' ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const sources = args.filter((a) => !a.startsWith('--'));
  if (!sources.length || args.includes('--help')) {
    console.log('Usage: refresh-session.mjs SOURCE... [--publish] [--headed] [--wait-human]  (SOURCE: a8 | moshimo | kdp | note | x | rakuten)');
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
