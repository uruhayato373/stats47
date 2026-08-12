/**
 * kdp-session.mjs — Amazon KDP (kdp.amazon.co.jp) Playwright 自動操作の共有セッション基盤 (stats47)
 * ---------------------------------------------------------------------------
 * coconala-operator (.claude/scripts/coconala/lib/coconala-session.mjs) と同じ設計を KDP へ移植。
 * 永続プロファイル + ログイン gate + account assert 方式。
 *
 * ★安全境界 (最重要・coconala と同思想):
 *   - ログイン認証はエージェントが行わない。初回のみ人間が headed Chrome で **stats47 の Amazon/KDP
 *     アカウント** に手動ログインし、永続プロファイル (.local/playwright-kdp-profile) に保持する。
 *   - 税務情報 (Tax interview)・銀行口座・支払情報の入力は **人間工程**。この基盤は一切触らない。
 *   - account assert: 別アカウントでの誤操作を防ぐ。**KDP はメールを本棚に出さず、アカウント
 *     ページは 2FA を再要求する**ため (2026-08-12 実測)、この口座で公開済みの本の ASIN
 *     (knownAsin) で同一性を確認する。個人情報は git 管理外の .local/kdp-account.local.json
 *     に置く (このリポジトリは public)。照合できないときは中断し、素通しにはしない。
 *   - draft-first: 既定は「下書き保存 (Save as Draft)」。実公開 (Publish) は呼び出し側の --commit +
 *     オーナー承認時のみ。KDP 公開は outward-facing・取り下げに時間がかかるため特に慎重に。
 *
 * SSOT: 出品内容 (title/description/keywords/price/epubPath 等) と公開状態 (status/asin) は
 *   .claude/config/kdp-listings.json。書籍設計 SSOT は packages/product-factory の KINDLE_BOOKS。
 * ---------------------------------------------------------------------------
 */
import { chromium } from "playwright";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// このファイル: .claude/scripts/kdp/lib/kdp-session.mjs → repo root は 4 つ上。
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

// ★プロファイルは本体チェックアウト固定 (worktree 分裂で「毎回ログイン」になるのを防ぐ)。
const PROFILE_ROOT = "/Users/minamidaisuke/stats47";
export const PROFILE = join(PROFILE_ROOT, ".local/playwright-kdp-profile");

export const ACCOUNT_PATH = join(ROOT, ".claude/config/kdp-account.json");
export const LISTINGS_PATH = join(ROOT, ".claude/config/kdp-listings.json");
export const DEBUG_DIR = join(ROOT, ".local/kdp-debug");
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * kdp-account.json を読む (無ければ空)。
 *
 * ★メールアドレスは git 管理外に置く (2026-08-12)
 *   このリポジトリは **public** なので、`.claude/config/kdp-account.json` に
 *   accountEmail を書くと公開される。誤アカウント防止の assert には実際の文字列が要るため、
 *   `.local/kdp-account.local.json` (gitignore 済) を**上書きとして重ねる**。
 *   共有してよい設定 (marketplace 等) は従来どおり config 側に置く。
 */
export const ACCOUNT_LOCAL_PATH = join(ROOT, ".local/kdp-account.local.json");

export function readAccount() {
  const read = (p) => {
    try {
      return JSON.parse(readFileSync(p, "utf8"));
    } catch {
      return {};
    }
  };
  return { ...read(ACCOUNT_PATH), ...read(ACCOUNT_LOCAL_PATH) };
}

/** kdp-listings.json を読む → { listings }。 */
function readListingsFile() {
  try {
    const j = JSON.parse(readFileSync(LISTINGS_PATH, "utf8"));
    return { listings: j.listings || {} };
  } catch {
    return { listings: {} };
  }
}

/** id → listing。 */
export function readListings() {
  return readListingsFile().listings;
}

/** 該当 book を status:'listed' + asin + publishedAt に書き戻す (KINDLE_BOOKS TS は触らない)。 */
export function writeBackListing(id, asin, today) {
  try {
    const j = JSON.parse(readFileSync(LISTINGS_PATH, "utf8"));
    if (!j.listings || !j.listings[id]) return false;
    j.listings[id].status = "listed";
    if (asin) j.listings[id].asin = asin;
    j.listings[id].publishedAt = today || new Date().toISOString().slice(0, 10);
    writeFileSync(LISTINGS_PATH, JSON.stringify(j, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

/** EPUB/カバーの絶対パスを解決 (repo 相対 → 絶対)。存在確認つき。 */
export function resolveAsset(relPath) {
  if (!relPath) return { ok: false, reason: "パス未指定" };
  const abs = relPath.startsWith("/") ? relPath : join(ROOT, relPath);
  if (!existsSync(abs)) return { ok: false, reason: `ファイルが見つからない: ${abs}` };
  return { ok: true, abs };
}

/** 永続プロファイルで Chrome を起動。 */
export async function launchContext({ headless = false } = {}) {
  mkdirSync(PROFILE, { recursive: true });
  return chromium.launchPersistentContext(PROFILE, {
    headless,
    channel: "chrome",
    proxy: PROXY ? { server: PROXY } : undefined,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

// ★日本語 UI を使う。フォームのセレクタ (kdp-form.mjs) が「タイトル」「著者名」など
//   日本語ラベルで要素を探すため、en_US で開くと 1 つも一致しない (2026-08-12 に発覚)。
//   marketplace は kdp-account.json のとおり amazon.co.jp。
// ★ドメインは **kdp.amazon.co.jp**。.com のサインインでは同じメールアドレスでも
//   「We cannot find an account with that email address」になる (2026-08-12 実測)。
//   Amazon のアカウントは .com と .co.jp で別の登録になっており、この口座は .co.jp 側。
//   doboku-note の KDP 自動化も .co.jp を使って実際に出版できている。
const BOOKSHELF_URL = "https://kdp.amazon.co.jp/ja_JP/bookshelf";

async function gotoResilient(page, url, { tries = 2, timeout = 45000 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });
      return true;
    } catch {
      if (i === tries - 1) return false;
      await sleep(1500);
    }
  }
  return false;
}

/**
 * ログイン済み状態を待つ。KDP bookshelf を開き、サインインページでなく本棚が描画されるまで polling。
 * 初回は headed 画面で人間が手動ログイン (+ 2FA) するのを待つ。
 */
export async function waitForLogin(page, { waitMinutes = 8, tag = "[login]" } = {}) {
  await gotoResilient(page, BOOKSHELF_URL);
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {}
  const deadline = Date.now() + waitMinutes * 60_000;
  let warned = false;
  let lastNudge = Date.now();
  /**
   * 現在の画面状態を読む。
   *
   * ★遷移中に落ちてはならない (2026-08-12 実測)。ログイン中は人がボタンを押すたびに
   *   ページが遷移し、その最中に page.evaluate を呼ぶと実行コンテキストが壊れて例外になる。
   *   もとはこれを捕まえておらず、**人がログインを始めた瞬間にスクリプトが落ちて**いた。
   *   遷移は待機中のあたりまえの状態なので、読めなければ「まだ待つ」として次の周回に回す。
   */
  const readState = async () => {
    try {
      return await page.evaluate(() => {
          const url = location.href;
          const onSignin = /\/ap\/signin|signin|\/ap\/mfa/.test(url) || /Sign-In|ログイン/.test(document.title || "");
          const bodyText = document.body?.innerText || "";
          const onShelf =
            /kdp\.amazon\.(?:com|co\.jp)\/.+\/bookshelf/.test(url) &&
            (/Bookshelf|本棚|Create|新しい|Kindle eBook/.test(bodyText) ||
              !!document.querySelector('[data-test-id], [id*="bookshelf"], a[href*="/title-setup/"]'));
          return { url, onSignin, onShelf };
      });
    } catch {
      return null;
    }
  };

  while (Date.now() < deadline) {
    const state = await readState();
    // 遷移中で読めなかった = まだ待つ。ここで落とさない。
    if (state && !state.onSignin && state.onShelf) return { ok: true };
    if (!warned) {
      console.log(`${tag} 未ログイン。開いた Chrome で stats47 の Amazon/KDP アカウントにログイン (2FA 含む) してください (最大 ${waitMinutes} 分待機)…`);
      warned = true;
    }
    await sleep(3000);
    // ★ここで遷移してよいのは「ページが無い」ときだけ。ログインのどの段階にいるかを
    //   URL から当てにいくと必ず取りこぼす (実測: amazon.co.jp のトップに一時的に
    //   落ちる場面があり、そこで遷移すると認証フローが切れる)。
    //   **画面を持っているのは人**なので、白紙とエラーページ以外は触らない。
    const url = page.url();
    const blank = !url || url === "about:blank" || /^chrome-error:/.test(url);
    if (blank && Date.now() - lastNudge > 30_000) {
      lastNudge = Date.now();
      await gotoResilient(page, BOOKSHELF_URL, { tries: 1 });
    }
  }
  return { ok: false, reason: `ログイン待機がタイムアウト (${waitMinutes}分)` };
}

/**
 * ログイン中のアカウントが期待アカウントか assert。
 * KDP はアカウントメニュー (右上) にアカウント名/メールを露出する。accountEmail or accountName の
 * いずれかが本文に現れることを確認する。どちらも未設定なら「ログイン済み」のみ確認して pass。
 */
export async function assertAccount(page, { tag = "[account]" } = {}) {
  const acct = readAccount();
  const email = (acct.accountEmail || "").trim();
  const name = (acct.accountName || "").trim();
  if (!email && !name) {
    console.log(`${tag} accountEmail/accountName 未設定のため「ログイン済み」のみ確認 (kdp-account.json に記入すると厳格 assert)`);
    return { ok: true };
  }
  await gotoResilient(page, BOOKSHELF_URL);
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {}
  // アカウントメニューを開いてメール/名前を露出させる (KDP の DOM は変わりやすいので複数手段)。
  let found = false;
  for (let i = 0; i < 4 && !found; i++) {
    found = await page.evaluate(
      (exp) => {
        const t = (document.body?.innerText || "") + " " + Array.from(document.querySelectorAll('[title],[aria-label]')).map((e) => (e.getAttribute("title") || "") + (e.getAttribute("aria-label") || "")).join(" ");
        return exp.some((s) => s && t.includes(s));
      },
      [email, name],
    );
    if (!found) await sleep(1500);
  }
  if (found) {
    console.log(`${tag} OK: KDP アカウント (${email || name}) を確認`);
    return { ok: true };
  }

  // ★メールで照合できないときの代替 (2026-08-12 実測)
  //   KDP はメールアドレスを本棚に出さない。「アカウント」リンクを踏むと
  //   `/ap/mfa` へ飛んで **2FA を再要求される** ので、エージェントは辿れない (人間工程)。
  //   そこで「この口座にしか無い本」で照合する。knownAsin は .local/kdp-account.local.json に
  //   置く (public リポジトリに ASIN を晒さないため)。**照合を諦めて素通しにはしない**。
  const knownAsin = (acct.knownAsin || "").trim();
  if (knownAsin) {
    const onShelf = await page.evaluate((a) => document.body?.innerText?.includes(a) ?? false, knownAsin);
    if (onShelf) {
      console.log(`${tag} OK: 既知の本 (ASIN ${knownAsin}) が本棚にあるため同一口座と確認`);
      return { ok: true };
    }
    return { ok: false, reason: `既知の本 (ASIN ${knownAsin}) が本棚に無い — 別アカウントの疑い` };
  }

  return {
    ok: false,
    reason:
      `期待 KDP アカウント (${email || name}) を確認できない。` +
      `KDP はメールを本棚に出さず、アカウントページは 2FA を再要求するため照合できない。` +
      `.local/kdp-account.local.json に knownAsin (この口座で公開済みの本の ASIN) を記入すると照合できる`,
  };
}

export function shotPath(name) {
  mkdirSync(DEBUG_DIR, { recursive: true });
  return join(DEBUG_DIR, name);
}
