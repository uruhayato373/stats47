/**
 * note.com 永続プロファイルへの対話ログイン (note-operator 用)
 *
 * coconala-operator と同型: 専用の永続プロファイル (.local/playwright-note-profile) を使い、
 * ログイン状態を跨いで保持する。headed Chrome を開き、ユーザーが stats47 でログインするのを待つ。
 * current_user の urlname==stats47 を検知したら .claude/config/note-account.json を書き、終了する。
 *
 * 別アカウント (dobokunote 等) でのログインは検知して警告する (取り違え防止)。
 *
 * 実行: node .claude/scripts/note/login-note-profile.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE = join(ROOT, ".local/playwright-note-profile");
const ACCOUNT_PATH = join(ROOT, ".claude/config/note-account.json");
const EXPECTED = "stats47";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const TIMEOUT_MS = 10 * 60 * 1000;

mkdirSync(PROFILE, { recursive: true });

async function launch() {
  const opts = {
    headless: false,
    viewport: { width: 1366, height: 1000 },
    userAgent: UA,
    args: ["--disable-blink-features=AutomationControlled"],
  };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, opts);
  }
}

async function currentUrlname(ctx) {
  try {
    const r = await ctx.request.get("https://note.com/api/v2/current_user", {
      headers: { "User-Agent": UA },
    });
    const d = (await r.json())?.data;
    return d && typeof d === "object" ? d.urlname ?? null : null;
  } catch {
    return null;
  }
}

const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://note.com/login", { waitUntil: "domcontentloaded" }).catch(() => {});
console.log("[note-login] ブラウザで note.com に stats47 としてログインしてください (最大 10 分待機)…");

const deadline = Date.now() + TIMEOUT_MS;
let name = null;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 4000));
  name = await currentUrlname(ctx);
  if (name === EXPECTED) break;
  if (name && name !== EXPECTED) {
    console.log(`[note-login] 別アカウントでログイン中: ${name} — stats47 に切り替えてください`);
  }
}

if (name === EXPECTED) {
  writeFileSync(
    ACCOUNT_PATH,
    JSON.stringify({ accountName: EXPECTED, urlname: EXPECTED, profile: ".local/playwright-note-profile" }, null, 2) + "\n",
  );
  console.log(`[note-login] LOGGED_IN stats47 — プロファイル保持 + ${ACCOUNT_PATH} を記録しました`);
  await ctx.close();
  process.exit(0);
} else {
  console.log("[note-login] タイムアウト: stats47 のログインを検知できませんでした");
  await ctx.close();
  process.exit(1);
}
