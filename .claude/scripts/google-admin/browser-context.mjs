/**
 * browser-context — google-admin 専用 Playwright persistent context + lock。
 * 安全契約: ./README.md「実行境界」。
 *
 * - dedicated profile `.local/playwright-google-admin-profile/` だけを使う
 *   (通常 Chrome / X / A8 / note 等の profile を使わない)。
 * - page 1 枚・context 1 つ。lock `.local/locks/google-admin.lock` で同時実行を拒否する。
 * - 未ログイン / MFA / CAPTCHA は突破しない (呼び元が headed でユーザーに依頼して待つ)。
 * - download は既定で cancel。cookie/localStorage/token を export しない。
 *   例外は read-only の公式 export UI のみで、呼び元が `launchAdminContext({ acceptDownloads: true })`
 *   と明示的に opt-in したときだけ有効になる (既定は false のまま = 設定変更 runner の契約は不変)。
 *   現在の唯一の利用者は `.claude/scripts/gsc/export-coverage-playwright.mjs`
 *   (GSC カバレッジは公式 API が無く UI export しか経路がない。README「操作別の正典と実行場所」)。
 * - finally で context.close() (persistent context は browser も閉じる)。
 *   runner 自身が起動した PID / lock / tab のみ片付ける (通常 Chrome を一括 kill しない)。
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
export const PROFILE_DIR = path.join(PROJECT_ROOT, ".local", "playwright-google-admin-profile");
export const LOCK_FILE = path.join(PROJECT_ROOT, ".local", "locks", "google-admin.lock");

/** lock を原子的に取得する。stale (プロセス死亡) は回収、生存中なら throw。 */
export function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
  try {
    const fd = fs.openSync(LOCK_FILE, "wx");
    fs.writeSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    fs.closeSync(fd);
    return;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  // 既存 lock の生存確認
  let holder = null;
  try {
    holder = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
  } catch {
    /* 壊れた lock は stale 扱い */
  }
  if (holder?.pid) {
    try {
      process.kill(holder.pid, 0); // 生存確認のみ (シグナルは送らない)
      throw new Error(`google-admin runner が既に実行中 (pid=${holder.pid}, since=${holder.startedAt})。多重実行しない`);
    } catch (e) {
      if (e.code !== "ESRCH") throw e; // ESRCH = プロセス死亡 → stale
    }
  }
  fs.rmSync(LOCK_FILE, { force: true });
  const fd = fs.openSync(LOCK_FILE, "wx");
  fs.writeSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  fs.closeSync(fd);
}

export function releaseLock() {
  try {
    const holder = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
    if (holder?.pid === process.pid) fs.rmSync(LOCK_FILE, { force: true });
  } catch {
    /* 自分の lock でなければ触らない */
  }
}

/**
 * 専用 profile の persistent context を 1 つ起動する。
 *
 * @param {{ acceptDownloads?: boolean }} [options]
 *   acceptDownloads: 既定 false (download を cancel する契約)。read-only の公式 export UI を
 *   使う呼び元だけが true を渡す。true のとき download の自動 cancel も外れるため、
 *   呼び元は保存先と対象ファイルを自分で限定すること。
 */
export async function launchAdminContext({ acceptDownloads = false } = {}) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1440, height: 1000 },
    acceptDownloads,
    // Google はサインイン画面で automation 検知を行い「安全でないブラウザ」として拒否する。
    // 実 Chrome channel + AutomationControlled 抑制でログイン済み session の利用を可能にする。
    // それでもサインイン自体が拒否される場合は `cli.mjs login` (CDP 非接続の素の Chrome) で
    // 人間が一度ログインし、このプロファイルを再利用する (credential には一切触れない)。
    args: ["--disable-blink-features=AutomationControlled", "--no-first-run", "--no-default-browser-check"],
    ignoreDefaultArgs: ["--enable-automation"],
  });
  // download は既定で受け付けない (opt-in したときだけ呼び元に委ねる)
  if (!acceptDownloads) {
    context.on("page", (p) => p.on("download", (d) => d.cancel().catch(() => {})));
  }
  const page = context.pages()[0] ?? (await context.newPage());
  if (!acceptDownloads) {
    page.on("download", (d) => d.cancel().catch(() => {}));
  }
  return { context, page };
}

/** ログインが要る状態か (accounts.google.com へのリダイレクト等)。突破はしない。 */
export function isLoginUrl(url) {
  return /accounts\.google\.com|ServiceLogin|signin\/v2|challenge\//.test(String(url));
}

/**
 * ログイン完了を待つ。headed browser でユーザーが操作する前提で、
 * 対象 URL パターンに戻るまで poll する (突破・自動入力はしない)。
 */
export async function waitForLogin(page, { doneUrlPattern, timeoutMs = 10 * 60 * 1000, onPrompt = () => {} } = {}) {
  onPrompt();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = page.url();
    if (!isLoginUrl(url) && doneUrlPattern.test(url)) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}
