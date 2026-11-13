#!/usr/bin/env node
/**
 * テーマページの「重さ」を全テーマで測る (見える文字数・高さ・図や表やカードの数・最初の画面に何が入るか)。
 * 共通の UI を直す前後で同じ測り方を当てるための道具 (THEME-PAGE-REVIEW-01)。判定はせず、数えるだけ。
 *
 * 測るのは 2 つのルート:
 *   - 県別 /areas/<県>/<テーマ> … 検索から入るのは主にこちら (検索の表示の 94%。2026-11-14)
 *   - 全国版 /themes/<テーマ>
 *
 * 使い方:
 *   node .claude/scripts/themes/measure-theme-weight.mjs [--base-url <既定は本番>] [--area 13000]
 *     [--widths 390,1280] [--themes a,b,c] [--concurrency 4] [--out <file>]
 * 既定の出力は OS の一時領域の stats47-theme-weight/<日付>.json。前後の比較の基準として残す回は
 *   --out data/themes/ui-weight/<日付>.json (台帳 themes.ui-weight) を指定する。
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { datasetDir } from "../../../config/datasets.mjs";
import siteConfig from "../lib/site-config.cjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function parseArgs(argv) {
  const args = { baseUrl: siteConfig.SITE_ORIGIN, area: "13000", widths: [390, 1280], concurrency: 4, themes: null };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--base-url") args.baseUrl = rest.shift().replace(/\/$/, "");
    else if (a === "--area") args.area = rest.shift();
    else if (a === "--widths") args.widths = rest.shift().split(",").map(Number);
    else if (a === "--themes") args.themes = rest.shift().split(",");
    else if (a === "--concurrency") args.concurrency = Number(rest.shift());
    else if (a === "--out") args.out = rest.shift();
    else throw new Error(`不明な引数: ${a}`);
  }
  args.out ??= path.join(tmpdir(), "stats47-theme-weight", `${new Date().toISOString().slice(0, 10)}.json`);
  return args;
}

/** ページの中で数える (ブラウザ側で動く)。 */
function measureInPage() {
  const main = document.querySelector("main");
  if (!main) return null;
  const vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const inFirstScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top + window.scrollY < vh;
  };
  const all = (sel) => [...main.querySelectorAll(sel)].filter(visible);
  const text = main.innerText.replace(/\s+/g, "");
  const charts = all('[data-theme-chart="true"]');
  const kpiCards = all('[data-theme-component-type="kpi-card"]');
  const components = all("[data-theme-component-type]");
  const tables = all("table");
  const firstScreenText = [...main.querySelectorAll("h1, h2, h3, p, li, td, th, dt, dd, span, a")]
    .filter((el) => el.children.length === 0 && inFirstScreen(el))
    .map((el) => el.textContent.trim())
    .join("")
    .replace(/\s+/g, "");
  return {
    height: Math.round(main.getBoundingClientRect().height),
    screens: Number((main.getBoundingClientRect().height / vh).toFixed(1)),
    textChars: text.length,
    h2: all("h2").length,
    charts: charts.length,
    kpiCards: kpiCards.length,
    components: components.length,
    tables: tables.length,
    tableRows: tables.reduce((n, t) => n + t.querySelectorAll("tbody tr").length, 0),
    firstScreen: {
      textChars: firstScreenText.length,
      charts: charts.filter(inFirstScreen).length,
      kpiCards: kpiCards.filter(inFirstScreen).length,
      components: components.filter(inFirstScreen).length,
    },
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

async function measureOne(browser, url, width) {
  const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, locale: "ja-JP" });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const status = response?.status() ?? null;
    if (status !== 200) return { status };
    // 図は後から描かれるので、通信が落ち着くまで待つ (落ち着かなくても測る)
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    return { status, ...(await page.evaluate(measureInPage)) };
  } catch (error) {
    return { status: null, error: String(error.message).slice(0, 120) };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const themes = (args.themes ?? readdirSync(path.join(ROOT, datasetDir("themes.catalogs"))).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))).sort();
  const jobs = themes.flatMap((themeKey) =>
    [
      { route: "prefecture", url: `${args.baseUrl}/areas/${args.area}/${themeKey}` },
      { route: "national", url: `${args.baseUrl}/themes/${themeKey}` },
    ].flatMap((r) => args.widths.map((width) => ({ themeKey, width, ...r }))),
  );
  const browser = await chromium.launch();
  const rows = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(args.concurrency, jobs.length) }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        rows.push({ themeKey: job.themeKey, route: job.route, width: job.width, ...(await measureOne(browser, job.url, job.width)) });
        if (rows.length % 20 === 0) console.error(`${rows.length}/${jobs.length}`);
      }
    }),
  );
  await browser.close();
  rows.sort((a, b) => a.themeKey.localeCompare(b.themeKey) || a.route.localeCompare(b.route) || a.width - b.width);
  mkdirSync(path.dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify({ measuredAt: new Date().toISOString(), baseUrl: args.baseUrl, area: args.area, widths: args.widths, rows }, null, 2)}\n`);
  const failed = rows.filter((r) => r.status !== 200).length;
  console.log(JSON.stringify({ out: args.out, pages: rows.length, failed }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
