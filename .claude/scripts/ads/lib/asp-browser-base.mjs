/**
 * asp-browser-base.mjs — ASP ブラウザ操作の汎用基盤 (ローカル専用)
 * ---------------------------------------------------------------------------
 * 永続 Chrome プロファイルの起動・ダウンロード捕捉・UI 変更時の debug artifact 保存
 * (認証情報マスク付き)・人間ログイン待ちのティッカーを束ねる。ASP 固有の知識は持たない。
 *
 * 由来: doboku-note `scripts/lib/google-console-browser.mjs` の汎用部を ASP 用に抽出したもの。
 * 両リポジトリで同型の事故対策 (自動化検知回避・秘密マスク・一意セレクタ) を共有するため、
 * 挙動を変えるときは向こうの実装と突き合わせること。GSC 固有 (プロパティ assert 等) は移植していない。
 *
 * 安全弁:
 *   - chromium.launchPersistentContext + channel:"chrome" (システム Chrome)
 *   - Cookie / storageState を標準出力へ書き出さない
 *   - debug 保存前に email / Bearer トークンをマスクする
 *   - CI では使わない (ローカル限定。認証情報は env に置かない)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// ─── リポジトリ root の解決 (Mac / Windows 両対応) ──────────────────────────
//
// ★ Mac パスを直書きすると Windows では別ドライブ配下に空プロファイルを掘ってしまい、
//   「ログイン済みなのに未ログイン扱い」になる (2026-07-27 に doboku-note で発覚)。
//   `process.platform` で分岐せず、**実在するほうを採る**フォールバック 1 本で両対応する。
//
// MAIN_CHECKOUT は Mac 本体チェックアウト。git worktree から実行しても同じログインを
// 共有させるために優先する (docs/01_技術設計/playwright-auth-profiles.md)。
// 実在しなければ、このファイル自身の位置から解決したリポジトリ root を使う
// (`process.cwd()` だと実行ディレクトリ次第でプロファイルが分裂するため使わない)。
const MAIN_CHECKOUT = "/Users/minamidaisuke/stats47";
// .claude/scripts/ads/lib/ → 4 階層上がリポジトリ root
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** プロファイル・state を置く root。Mac 本体チェックアウトが実在すればそれ、無ければ現リポジトリ。 */
export function profileRoot() {
  return existsSync(MAIN_CHECKOUT) ? MAIN_CHECKOUT : REPO_ROOT;
}

/** リポジトリ root (debug artifact・config・state の基準)。 */
export function repoRoot() {
  return REPO_ROOT;
}

export function profileDir(cfg) {
  return join(profileRoot(), cfg.browser.profileDir);
}

export function debugRoot(cfg) {
  return join(REPO_ROOT, cfg.browser.debugDir);
}

/** ISO 由来の run-id (ファイル名安全)。呼び出し側で 1 回生成し使い回す。 */
export function makeRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
}

/** email / Bearer トークンを伏せる。debug 保存前に必ず通す。 */
export function maskSecrets(text) {
  return String(text ?? "")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email-redacted]")
    .replace(/(Bearer|Authorization:?)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [redacted]")
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[redacted]"');
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function sha256Buf(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * 永続コンテキストを起動する。acceptDownloads:true で download イベントを使える。
 *
 * Playwright 既定の自動化シグナル (`--enable-automation` / `navigator.webdriver=true`) は
 * 一部サイトのログイン画面が検知して**正当な本人ログインまで**弾く。自分の口座へ自分で
 * アクセスする first-party 用途なので通常ブラウザ挙動に揃える。ボット偽装や CAPTCHA/2FA の
 * 自動突破はしない (人間が完了する)。
 */
export async function launchContext(cfg, { headless } = {}) {
  const dir = profileDir(cfg);
  mkdirSync(dir, { recursive: true });
  const opts = {
    headless: headless ?? cfg.browser.headless ?? false,
    acceptDownloads: true,
    viewport: null,
    locale: "ja-JP",
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--no-first-run", "--no-default-browser-check"],
  };
  const channel = cfg.browser.channel || "chrome";
  let ctx;
  try {
    ctx = await chromium.launchPersistentContext(dir, { ...opts, channel });
  } catch (e) {
    // 会社支給 Windows では、インストール済み Chrome を独自 user-data-dir で起動すると
    // 即座にプロセスが落ちる (2026-07-28 実測: channel=chrome は NG / 同梱 chromium は OK)。
    // A8 スクリプトが動いていたのは channel 指定なし = 同梱 chromium だったため。
    // プロファイルは channel をまたいでも同じディレクトリを使うのでログインは維持される。
    console.log(`⚠️  channel=${channel} で起動できず同梱 chromium にフォールバック (${String(e.message).split("\n")[0]})`);
    ctx = await chromium.launchPersistentContext(dir, opts);
  }
  await ctx.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    } catch {}
  });
  ctx.setDefaultTimeout(cfg.browser.timeoutMs || 30000);
  return ctx;
}

/** 一定間隔で状態を表示するティッカー (無限待機の可視化)。stop() で止める。 */
export function startStatusTicker(label, intervalMs = 120000) {
  const started = Date.now();
  const timer = setInterval(() => {
    const sec = Math.round((Date.now() - started) / 1000);
    console.log(`[待機中] ${label} (経過 ${sec}s) — 人間の操作が必要な場合はブラウザで完了してください`);
  }, intervalMs);
  if (timer.unref) timer.unref();
  return () => clearInterval(timer);
}

/**
 * download イベントで確実にファイルを保存する。suggestedFilename は信用しない。
 * @returns {Promise<{path:string, sha256:string, bytes:number, suggested:string}>}
 */
export async function downloadTo(page, triggerFn, destPath, { timeout } = {}) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: timeout || 60000 }),
    Promise.resolve().then(triggerFn),
  ]);
  await download.saveAs(destPath);
  const buf = readFileSync(destPath);
  return { path: destPath, sha256: sha256Buf(buf), bytes: buf.length, suggested: download.suggestedFilename() };
}

/**
 * UI 変更・想定外時の debug artifact を保存して停止判断を助ける。
 * screenshot.png / page.html / url.txt / visible-text.txt / failure.json。
 * HTML と visible-text は maskSecrets を通す (email/token を保存しない)。
 */
export async function dumpFailure(page, cfg, runId, failure = {}) {
  const dir = join(debugRoot(cfg), runId);
  mkdirSync(dir, { recursive: true });
  const url = page.url();
  let html = "";
  let visible = "";
  try {
    html = await page.content();
  } catch {}
  try {
    visible = await page.locator("body").innerText();
  } catch {}
  const shotPath = join(dir, "screenshot.png");
  try {
    await page.screenshot({ path: shotPath, fullPage: true });
  } catch {}
  writeFileSync(join(dir, "page.html"), maskSecrets(html), "utf-8");
  writeFileSync(join(dir, "url.txt"), url + "\n", "utf-8");
  writeFileSync(join(dir, "visible-text.txt"), maskSecrets(visible), "utf-8");
  writeFileSync(
    join(dir, "failure.json"),
    JSON.stringify(
      {
        step: failure.step ?? null,
        expected: failure.expected ?? null,
        actual: failure.actual ?? null,
        url,
        message: maskSecrets(failure.message ?? ""),
        timestamp: new Date().toISOString(),
        candidateCount: failure.candidateCount ?? null,
        screenshotPath: shotPath,
        htmlPath: join(dir, "page.html"),
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.error(`[debug] artifact 保存: ${dir}`);
  return dir;
}

/**
 * ラベル候補 (ja/en 配列) のいずれかにマッチする role=button/link を一意に取得する。
 * 0 件 or 複数件なら null を返す (呼び出し側は推測クリックせず dump → 停止)。
 */
export async function findUniqueByLabels(page, labels, { roles = ["button", "link"] } = {}) {
  const found = [];
  for (const role of roles) {
    for (const label of labels) {
      const loc = page.getByRole(role, { name: label, exact: false });
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i++) found.push(loc.nth(i));
    }
  }
  if (found.length === 0) {
    for (const label of labels) {
      const loc = page.getByText(label, { exact: false });
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i++) found.push(loc.nth(i));
    }
  }
  if (found.length === 1) return { locator: found[0], count: 1 };
  return { locator: null, count: found.length };
}
