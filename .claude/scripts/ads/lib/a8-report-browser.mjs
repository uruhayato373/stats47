/**
 * a8-report-browser.mjs — A8.net メディア管理画面のブラウザ操作（レポート CSV 取得用）
 * ---------------------------------------------------------------------------
 * 由来: doboku-note の scripts/lib/a8-report-browser.mjs
 *
 * stats47 での適応:
 *   - 汎用のブラウザ基盤（persistent context / download 捕捉 / debug dump / 一意セレクタ）は
 *     doboku 側では google-console-browser.mjs から import していたが、stats47 には GSC 用の
 *     その汎用層が既に ASP 用として抽出済みの `asp-browser-base.mjs`（同 lib ディレクトリ）が
 *     あるためそちらから import する（コピーしない）。GSC 固有関数（loadConfig /
 *     assertGscProperty / isSignedInToGsc / waitForHumanLogin / isGoogleLoginPage）は
 *     stats47 に無いので使わず、A8 固有ロジックとしてこのファイル内に閉じて実装した。
 *   - doboku の `checkoutRoot()`（profileDir() から末尾サフィックスを逆算する実装）は不要になった。
 *     asp-browser-base.mjs が Mac/Windows 両対応の `profileRoot()` を既に提供しているため、
 *     それをそのまま使う。
 *
 * config の `browser` ブロックのキー名は `.claude/config/affiliate-asp.json`（scout-asp が使う
 * ASP 共通設定）の a8 ブロックと揃えてあり、実際に **同じ profileDir/stateFile を指す**（A8 の
 * ログインセッションを scout-asp と共有するため。別パスにすると Chrome プロファイルが分裂し
 * 二重ログインが必要になる）。
 *
 * ここで新規に書くのは A8 固有の 7 点だけ:
 *   - loadA8Config      : 設定読み込み
 *   - restoreA8Session / saveA8Session : storageState の Cookie 再注入/保存（A8 の認証実体）
 *   - isLoggedInA8      : ログイン判定
 *   - waitForHumanLoginA8 : 人間のログインを待つ（何も自動クリックしない）
 *   - assertA8Account   : 口座（メディアID）の fail-closed assert（誤アカウント操作の防止）
 *   - assertTargetSiteRow : サイト別レポートに対象サイト行があるかの確認
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  launchContext,
  profileDir,
  profileRoot,
  repoRoot,
  debugRoot,
  downloadTo,
  dumpFailure,
  findUniqueByLabels,
  makeRunId,
  sha256File,
  sha256Buf,
  maskSecrets,
  startStatusTicker,
} from "./asp-browser-base.mjs";

export {
  launchContext,
  profileDir,
  profileRoot,
  repoRoot,
  debugRoot,
  downloadTo,
  dumpFailure,
  findUniqueByLabels,
  makeRunId,
  sha256File,
  sha256Buf,
  maskSecrets,
  startStatusTicker,
};

export const A8_CONFIG_PATH = join(repoRoot(), ".claude/config/a8-report-automation.json");

export function loadA8Config() {
  const cfg = JSON.parse(readFileSync(A8_CONFIG_PATH, "utf-8"));
  if (!cfg?.a8?.targetSite) throw new Error("a8.targetSite が config にありません");
  return cfg;
}

/** プロファイルと同じ「本体チェックアウト固定」root（asp-browser-base.mjs の profileRoot() を再利用）。 */
export function checkoutRoot() {
  return profileRoot();
}

/** レポート種別の URL。path が無ければ home（メニュー操作にフォールバック）。 */
export function reportUrl(cfg, reportKey) {
  const r = cfg.a8.reports[reportKey];
  if (!r) throw new Error(`未知の reportKey: ${reportKey}`);
  return r.path ? `${cfg.a8.baseUrl}${r.path}` : `${cfg.a8.baseUrl}${cfg.a8.homePath}`;
}

/**
 * storageState の Cookie を context に戻す。
 * A8 の認証セッション Cookie は永続プロファイルに残らないため、これが認証の実体
 * （scout-asp の asp-browser.mjs と同方式）。プロファイル本体と同じ root 解決を使う。
 */
export async function restoreA8Session(context, cfg) {
  const statePath = join(checkoutRoot(), cfg.browser.stateFile);
  if (!existsSync(statePath)) {
    return { ok: false, statePath, reason: "state-missing" };
  }
  try {
    const state = JSON.parse(readFileSync(statePath, "utf-8"));
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
      await context.addCookies(state.cookies);
      return { ok: true, statePath, cookies: state.cookies.length };
    }
    return { ok: false, statePath, reason: "no-cookies" };
  } catch (e) {
    return { ok: false, statePath, reason: `parse-error: ${String(e.message).slice(0, 80)}` };
  }
}

/**
 * 現在のセッション Cookie を storageState として保存する（次回以降の再利用の実体）。
 * A8 のセッション Cookie は永続プロファイルに残らないため、人間のログイン直後にこれを呼ぶ。
 * scout-asp（asp-browser.mjs / affiliate-asp.json の a8 プロファイル）と同じ state ファイルを共有する。
 */
export async function saveA8Session(context, cfg) {
  const statePath = join(checkoutRoot(), cfg.browser.stateFile);
  try {
    await context.storageState({ path: statePath });
    return { ok: true, statePath };
  } catch (e) {
    return { ok: false, statePath, reason: String(e.message).slice(0, 120) };
  }
}

/** 再認証/ログインへ飛ばされておらず、media-console 上でパスワード欄が無ければログイン済み。 */
export async function isLoggedInA8(page, cfg) {
  const url = page.url();
  if (new RegExp(cfg.a8.reAuthPattern, "i").test(url)) return false;
  if (!/media-console\.a8\.net/.test(url)) return false;
  const hasPw = await page
    .evaluate(() => document.querySelectorAll("input[type=password]").length > 0)
    .catch(() => true);
  return !hasPw;
}

/**
 * 人間のログインを待つ（自動入力・自動クリックは一切しない）。
 * 収益アカウントのため CAPTCHA/2FA も人間が処理する。成功 true / タイムアウト false。
 */
export async function waitForHumanLoginA8(page, cfg, { pollMs = 3000 } = {}) {
  const maxWait = cfg.browser.loginMaxWaitMs || 900000;
  const stop = startStatusTicker(
    "A8 ログインを待機（ブラウザでログインしてください）",
    cfg.browser.statusIntervalMs || 120000,
  );
  const deadline = Date.now() + maxWait;
  try {
    while (Date.now() < deadline) {
      if (await isLoggedInA8(page, cfg).catch(() => false)) return true;
      await page.waitForTimeout(pollMs);
    }
    return false;
  } finally {
    stop();
  }
}

/** ヘッダー等に見えているサイト名テキストを返す（判定材料の生テキスト）。 */
export async function readVisibleSiteContext(page) {
  const body = await page.locator("body").innerText().catch(() => "");
  return body.slice(0, 4000);
}

/**
 * 口座（メディアID）の assert — 誤アカウント操作の防止。
 *
 * ★A8 の管理画面に**サイト切替は無い**（doboku-note 側 2026-07-27 実機確認。この口座は
 * stats47 と doboku-note の共用なので同じ制約が適用される）。ヘッダーの「サイト名」は口座の
 * 代表サイトが常に出るだけなので、ここで対象サイト名を探しても永久に見つからない。
 * よってログイン直後に検証すべきは「正しい口座か」＝ mediaId。サイトの分離はレポート単位
 * （siteScope）で行う。
 */
export async function assertA8Account(page, cfg) {
  const text = await readVisibleSiteContext(page);
  const mediaId = cfg.a8.mediaId;
  if (!mediaId) return { ok: false, reason: "config に a8.mediaId が無い" };
  if (text.includes(mediaId)) return { ok: true, mediaId };
  return { ok: false, mediaId, reason: `画面にメディアID "${mediaId}" が見当たらない（別口座でログインしている可能性）` };
}

/**
 * サイト別レポートに targetSite の行があるか（site-rows レポート専用の帰属確認）。
 * 無ければ「対象サイトの実績を取れていない」ので、呼び出し側は取り込みを中止する。
 */
export async function assertTargetSiteRow(page, cfg) {
  const text = await readVisibleSiteContext(page);
  const target = cfg.a8.targetSite;
  if (text.includes(target)) return { ok: true, target };
  return { ok: false, target, reason: `サイト別レポートに "${target}" の行が見当たらない` };
}
