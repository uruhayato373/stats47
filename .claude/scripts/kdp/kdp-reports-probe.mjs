#!/usr/bin/env node
/**
 * kdp-reports-probe.mjs — KDP レポート画面 (販売数・KENP) の構造を **読み取り専用** で採取する。
 *
 * 目的 (2026-09-19): 22 冊が販売中なのに `.claude/state/products/sales-ledger.json` が空で、
 * 需要ファーストの判断 (横展開 / 取り下げ) ができない。レポートは KDP の React SPA が XHR で
 * JSON を取るので、画面を開いて **通ったレスポンスをそのまま保存** し、抽出器はそれを見て書く
 * (`kdp-publish --probe` と同じ「実機を見てから実装する」手順)。
 *
 * 実行: node .claude/scripts/kdp/kdp-reports-probe.mjs [--days 90]
 * 出力: .local/kdp-debug/reports-probe-<ts>/{responses.json, page.txt, *.png}
 * 何も書き換えない (KDP への POST は起こさない。ページ内のフィルタ操作もしない)。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEBUG_DIR, assertAccount, launchContext, sleep, waitForLogin } from "./lib/kdp-session.mjs";

// KDP のレポートは別ドメイン (kdpreports.amazon.com・KDP Reports) に移っている。旧 URL は 404 (2026-09-19 実測)。
const REPORTS_URLS = [
  "https://kdpreports.amazon.com/dashboard",
  "https://kdpreports.amazon.com/orders",
  "https://kdpreports.amazon.com/kenp-read",
  "https://kdp.amazon.co.jp/ja_JP/reports",
];

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(DEBUG_DIR, `reports-probe-${ts}`);
mkdirSync(outDir, { recursive: true });

const ctx = await launchContext({ headless: false });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const responses = [];
page.on("response", async (res) => {
  try {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (!/kdp\.amazon\.co\.jp|kdpreports\.amazon\.com/.test(url) || !/json/.test(ct)) return;
    const body = await res.text();
    responses.push({ url, status: res.status(), bytes: body.length, body: body.slice(0, 400000) });
  } catch {}
});

try {
  await waitForLogin(page, { waitMinutes: 1, tag: "[reports]" });
  const acct = await assertAccount(page, { tag: "[reports]" });
  if (!acct.ok) throw new Error("account assert failed");
  for (const url of REPORTS_URLS) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    try { await page.waitForLoadState("networkidle", { timeout: 20000 }); } catch {}
    await sleep(4000);
    const name = url.split("/").pop() || "dashboard";
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true }).catch(() => {});
    const text = await page.evaluate(() => document.body?.innerText || "");
    writeFileSync(join(outDir, `${name}.txt`), text);
    console.log(`[reports] ${url} → text ${text.length} chars / json responses so far ${responses.length}`);
  }
  writeFileSync(join(outDir, "responses.json"), JSON.stringify(responses, null, 1));
  console.log(`[reports] saved ${responses.length} json responses → ${outDir}`);
} finally {
  await ctx.close();
}
