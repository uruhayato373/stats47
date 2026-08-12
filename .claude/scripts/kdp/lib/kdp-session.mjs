/**
 * kdp-session.mjs — Amazon KDP (kdp.amazon.com) Playwright 自動操作の共有セッション基盤 (stats47)
 * ---------------------------------------------------------------------------
 * coconala-operator (.claude/scripts/coconala/lib/coconala-session.mjs) と同じ設計を KDP へ移植。
 * 永続プロファイル + ログイン gate + account assert 方式。
 *
 * ★安全境界 (最重要・coconala と同思想):
 *   - ログイン認証はエージェントが行わない。初回のみ人間が headed Chrome で **stats47 の Amazon/KDP
 *     アカウント** に手動ログインし、永続プロファイル (.local/playwright-kdp-profile) に保持する。
 *   - 税務情報 (Tax interview)・銀行口座・支払情報の入力は **人間工程**。この基盤は一切触らない。
 *   - account assert: kdp-account.json の accountEmail (or accountName) が KDP のアカウントメニューに
 *     現れることを確認してから操作する。別アカウントは中断。
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

/** kdp-account.json を読む (無ければ空)。 */
export function readAccount() {
  try {
    return JSON.parse(readFileSync(ACCOUNT_PATH, "utf8"));
  } catch {
    return {};
  }
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
const BOOKSHELF_URL = "https://kdp.amazon.com/ja_JP/bookshelf";

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
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const url = location.href;
      const onSignin = /\/ap\/signin|signin|\/ap\/mfa/.test(url) || /Sign-In|ログイン/.test(document.title || "");
      const bodyText = document.body?.innerText || "";
      const onShelf =
        /kdp\.amazon\.com\/.+\/bookshelf/.test(url) &&
        (/Bookshelf|本棚|Create|新しい|Kindle eBook/.test(bodyText) ||
          !!document.querySelector('[data-test-id], [id*="bookshelf"], a[href*="/title-setup/"]'));
      return { url, onSignin, onShelf };
    });
    if (!state.onSignin && state.onShelf) return { ok: true };
    if (!warned) {
      console.log(`${tag} 未ログイン。開いた Chrome で stats47 の Amazon/KDP アカウントにログイン (2FA 含む) してください (最大 ${waitMinutes} 分待機)…`);
      warned = true;
    }
    await sleep(3000);
    // ★サインイン画面にいる間は絶対に遷移させない (2026-08-12 実測で発覚)。
    //   もとは 3 秒ごとに本棚 URL へ goto しており、**人がメールアドレスを打っている最中に
    //   ページごと飛ばしていた**。「入力が途中でリセットされる」という症状の正体がこれ。
    //   人のログインを待つのが目的なのだから、待っている画面を奪ってはならない。
    //   サインインでも本棚でもない場所 (エラーページ等) に落ちたときだけ、30 秒に 1 回だけ戻す。
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
  return { ok: false, reason: `期待 KDP アカウント (${email || name}) を確認できない (別アカウントの疑い・アカウントメニュー DOM 変更の可能性)` };
}

export function shotPath(name) {
  mkdirSync(DEBUG_DIR, { recursive: true });
  return join(DEBUG_DIR, name);
}
