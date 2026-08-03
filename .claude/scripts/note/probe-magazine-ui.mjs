/**
 * note.com マガジン管理 UI の read-only probe (note-operator 実装前の DOM 調査)
 *
 * 永続プロファイルを再利用して stats47 として複数の候補 URL を巡回し、ページ構造
 * (title / 最終 URL / 主要ボタン・リンク・フォーム) を .local/note-operator-debug/ に dump する。
 * ★read-only: クリック・作成・送信は一切しない。
 *
 * 実行: node .claude/scripts/note/probe-magazine-ui.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE = join(ROOT, ".local/playwright-note-profile");
const OUT = join(ROOT, ".local/note-operator-debug");
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  ["current_user", "https://note.com/api/v2/current_user"],
  ["magazines-settings", "https://note.com/sitesettings/magazines"],
  ["magazine-list", "https://note.com/stats47/magazines"],
  ["creator-membership", "https://note.com/sitesettings/membership_summary"],
];

async function launch() {
  const opts = { headless: true, viewport: { width: 1366, height: 1000 } };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, opts);
  }
}

const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
const report = [];

for (const [label, url] of CANDIDATES) {
  const rec = { label, url };
  try {
    if (url.includes("/api/")) {
      const r = await ctx.request.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      rec.status = r.status();
      const j = await r.json().catch(() => null);
      rec.apiData = j?.data ? { urlname: j.data.urlname, nickname: j.data.nickname, isPremium: j.data.isPremium } : j;
    } else {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch((e) => ({ err: String(e) }));
      await page.waitForTimeout(2500);
      rec.status = resp?.status?.() ?? null;
      rec.finalUrl = page.url();
      rec.title = await page.title().catch(() => null);
      // 主要な操作要素を dump (テキスト付き button / a / input / textarea)
      rec.buttons = await page.$$eval("button", (els) =>
        els.map((e) => (e.textContent || "").trim()).filter((t) => t && t.length < 40).slice(0, 40),
      ).catch(() => []);
      rec.links = await page.$$eval("a[href]", (els) =>
        els.map((e) => ({ t: (e.textContent || "").trim(), href: e.getAttribute("href") }))
          .filter((x) => x.t && (/マガジン|magazine|作成|追加|新規|記事/.test(x.t) || /magazine/.test(x.href || "")))
          .slice(0, 30),
      ).catch(() => []);
      rec.inputs = await page.$$eval("input, textarea", (els) =>
        els.map((e) => ({ tag: e.tagName.toLowerCase(), name: e.getAttribute("name"), placeholder: e.getAttribute("placeholder"), type: e.getAttribute("type") })).slice(0, 20),
      ).catch(() => []);
      await page.screenshot({ path: join(OUT, `${label}.png`), fullPage: false }).catch(() => {});
    }
  } catch (e) {
    rec.error = String(e);
  }
  report.push(rec);
  console.log(`[${label}] status=${rec.status ?? rec.error ?? "?"} final=${rec.finalUrl ?? ""} title="${rec.title ?? ""}"`);
}

writeFileSync(join(OUT, "probe-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`\n→ ${join(OUT, "probe-report.json")} + スクショ ${OUT}/*.png`);
await ctx.close();
process.exit(0);
