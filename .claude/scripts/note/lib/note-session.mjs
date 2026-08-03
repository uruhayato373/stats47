/**
 * note-operator セッション基盤 (coconala-session と同型)
 *
 * 永続プロファイル (.local/playwright-note-profile) で note.com を開き、
 * account assert (urlname==stats47) を通してから操作させる。別アカウントは即中断。
 *
 * ★書き込み系操作は呼び出し側で --commit gate を必須にすること。
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
export const PROFILE = join(ROOT, ".local/playwright-note-profile");
export const ACCOUNT_PATH = join(ROOT, ".claude/config/note-account.json");
export const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export function readAccount() {
  try {
    return JSON.parse(readFileSync(ACCOUNT_PATH, "utf8"));
  } catch {
    return {};
  }
}

/** 永続プロファイルで Chrome を起動 (channel:chrome、fallback default)。既定 headless。 */
export async function launchContext({ headless = true } = {}) {
  const opts = { headless, viewport: { width: 1440, height: 1000 }, userAgent: UA, args: ["--disable-blink-features=AutomationControlled"] };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, opts);
  }
}

/** current_user API で urlname を取得。 */
export async function currentUrlname(ctx) {
  try {
    const r = await ctx.request.get("https://note.com/api/v2/current_user", { headers: { "User-Agent": UA } });
    const d = (await r.json())?.data;
    return d && typeof d === "object" ? d.urlname ?? null : null;
  } catch {
    return null;
  }
}

/**
 * account assert。期待 urlname (note-account.json の urlname、既定 stats47) と一致を確認。
 * 不一致・未ログインは Error を throw (呼び出し側で即中断)。
 */
export async function assertAccount(ctx) {
  const expected = readAccount().urlname || "stats47";
  const name = await currentUrlname(ctx);
  if (!name) throw new Error("[note-session] 未ログイン (current_user 取得不可)。login-note-profile.mjs で再ログインしてください");
  if (name !== expected) throw new Error(`[note-session] 別アカウント: ${name} (期待 ${expected})。取り違え防止のため中断`);
  return name;
}
