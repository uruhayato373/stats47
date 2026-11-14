#!/usr/bin/env node
/**
 * テーマページの「重さ」を全テーマで測る (見える文字数・高さ・図や表やカードの数・最初の画面に何が入るか)。
 * 共通の UI を直す前後で同じ測り方を当てるための道具 (THEME-PAGE-REVIEW-01)。
 *
 * 重さ (高さ・文字数・図の数) は数えるだけで判定しない。読みやすさの品質基準 6 項目は違反として数える
 * (各行の violations。0 件が目標):
 *   few-first-screen-tiles … 最初の画面に数値のタイルが 2 個未満 (ページにはタイルが 2 個以上ある = 並べ方の問題)
 *   few-tiles-available    … ページ全体で数値のタイルが 2 個未満 (出せる値が無い = データの問題)
 *   broken-number          … 数字が途中で折り返している (タイルの値・表の数値のセル)
 *   empty-tile             … 値の無いタイル (「—」) が出ている
 *   overflow-x             … 横にはみ出している
 *   narrow-first-column    … 表の 1 列目が 1 行 4 文字未満で折り返している
 *   not-200                … ページが 200 を返さない (県別に出さないテーマは測らない)
 *
 * 測るのは 2 つのルート:
 *   - 県別 /areas/<県>/<テーマ> … 検索から入るのは主にこちら (検索の表示の 94%。2026-11-14)
 *   - 全国版 /themes/<テーマ>
 *
 * 使い方:
 *   node .claude/scripts/themes/measure-theme-weight.mjs [--base-url <既定は本番>] [--area 13000]
 *     [--widths 390,1280] [--themes a,b,c] [--concurrency 4] [--timeout 60000] [--out <file>]
 * 既定の出力は OS の一時領域の stats47-theme-weight/<日付>.json。前後の比較の基準として残す回は
 *   --out data/themes/ui-weight/<日付>.json (台帳 themes.ui-weight) を指定する。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { datasetDir } from "../../../config/datasets.mjs";
import siteConfig from "../lib/site-config.cjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** 県別ページに出さないテーマ (都道府県単位で集計できないインフラ系)。正本は公開サイトの設定で、ここに写しを持たない。 */
function areaExcludedThemeKeys() {
  const source = readFileSync(path.join(ROOT, "apps/web/src/features/theme-dashboard/config/area-theme-slugs.ts"), "utf8");
  const block = source.match(/AREA_EXCLUDED_THEME_KEYS[^=]*=\s*new Set\(\[([^\]]*)\]/);
  const keys = [...(block?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (keys.length === 0) throw new Error("area-theme-slugs.ts から県別に出さないテーマを読めない (書き方が変わった)");
  return new Set(keys);
}

function parseArgs(argv) {
  const args = { baseUrl: siteConfig.SITE_ORIGIN, area: "13000", widths: [390, 1280], concurrency: 4, themes: null, timeout: 60000 };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--base-url") args.baseUrl = rest.shift().replace(/\/$/, "");
    else if (a === "--area") args.area = rest.shift();
    else if (a === "--widths") args.widths = rest.shift().split(",").map(Number);
    else if (a === "--themes") args.themes = rest.shift().split(",");
    else if (a === "--concurrency") args.concurrency = Number(rest.shift());
    else if (a === "--out") args.out = rest.shift();
    // 手元の開発サーバーは初回のコンパイルが遅い。時間切れを「ページが開かない」と数えないよう延ばせる
    else if (a === "--timeout") args.timeout = Number(rest.shift());
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
  // 文字が何行に分かれて描かれているか (行の上端の位置の種類を数える)
  const lineCount = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
  };
  const tiles = all('[data-slot-kind="stat-tile"]');
  const tileValue = (tile) => tile.querySelector("dl > dd > span");
  const emptyTiles = tiles.filter((tile) => tileValue(tile)?.textContent.trim() === "—");
  // 文字の節の中で、数字の並び (桁区切り・小数点を含む) の途中で行が変わっているか。
  // 「1,611 / 95」が空白で改行するのは数えない (数字は割れていない)
  const breaksInsideNumber = (textNode) => {
    const text = textNode.textContent;
    const topOf = (i) => {
      const range = document.createRange();
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const rect = range.getClientRects()[0];
      return rect ? Math.round(rect.top) : null;
    };
    for (let i = 1; i < text.length; i += 1) {
      if (!/[\d,.]/.test(text[i - 1]) || !/[\d,.]/.test(text[i])) continue;
      const a = topOf(i - 1), b = topOf(i);
      if (a !== null && b !== null && a !== b) return true;
    }
    return false;
  };
  const textNodesOf = (el) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
  // タイルの値は「数字 + 単位」。数字の文字の節だけを見て、単位が次の行へ回るのは数えない
  const brokenTileNumbers = tiles.filter((tile) => textNodesOf(tileValue(tile) ?? tile.ownerDocument.createElement("i")).some(breaksInsideNumber));
  const brokenCellNumbers = tables.flatMap((t) => [...t.querySelectorAll("tbody td")]).filter(
    (cell) => visible(cell) && cell.children.length === 0 && textNodesOf(cell).some(breaksInsideNumber),
  );
  // 1 列目の「名前」が 1 行 4 文字未満で折り返しているか。名前の下に小さく添えた補足 (<small class="block"> の年・県名) は
  // 意図した 2 段目なので数えない
  const narrowFirstColumnRows = tables.flatMap((t) => [...t.querySelectorAll("tbody tr")]).filter((row) => {
    const cell = row.querySelector("th, td");
    if (!cell || !visible(cell)) return false;
    const name = [...cell.childNodes].filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.tagName === "SMALL"));
    const chars = name.map((n) => n.textContent).join("").replace(/\s+/g, "").length;
    if (chars === 0) return false;
    const range = document.createRange();
    range.setStartBefore(name[0]);
    range.setEndAfter(name[name.length - 1]);
    const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    return lines > 1 && chars / lines < 4;
  });
  const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const firstScreenTiles = tiles.filter(inFirstScreen).length;
  const violations = [
    // ページ全体でもタイルが 2 個に満たないのは画面の並べ方でなくデータの穴 (全国の値が無い指標ばかりの全国版など)。原因が違うので分けて数える
    ...(tiles.length < 2 ? ["few-tiles-available"] : firstScreenTiles < 2 ? ["few-first-screen-tiles"] : []),
    ...(brokenTileNumbers.length + brokenCellNumbers.length > 0 ? ["broken-number"] : []),
    ...(emptyTiles.length > 0 ? ["empty-tile"] : []),
    ...(overflowX > 0 ? ["overflow-x"] : []),
    ...(narrowFirstColumnRows.length > 0 ? ["narrow-first-column"] : []),
  ];
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
    overflowX,
    quality: {
      statTiles: tiles.length,
      firstScreenTiles,
      emptyTiles: emptyTiles.length,
      brokenNumbers: brokenTileNumbers.length + brokenCellNumbers.length,
      narrowFirstColumnRows: narrowFirstColumnRows.length,
    },
    violations,
  };
}

async function measureOne(browser, url, width, timeout) {
  const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, locale: "ja-JP" });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    const status = response?.status() ?? null;
    if (status !== 200) return { status, violations: ["not-200"] };
    // 図は後から描かれるので、通信が落ち着くまで待つ (落ち着かなくても測る)
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    return { status, ...(await page.evaluate(measureInPage)) };
  } catch (error) {
    return { status: null, error: String(error.message).slice(0, 120), violations: ["not-200"] };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const themes = (args.themes ?? readdirSync(path.join(ROOT, datasetDir("themes.catalogs"))).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))).sort();
  const areaExcluded = areaExcludedThemeKeys();
  const jobs = themes.flatMap((themeKey) =>
    [
      ...(areaExcluded.has(themeKey) ? [] : [{ route: "prefecture", url: `${args.baseUrl}/areas/${args.area}/${themeKey}` }]),
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
        rows.push({ themeKey: job.themeKey, route: job.route, width: job.width, ...(await measureOne(browser, job.url, job.width, args.timeout)) });
        if (rows.length % 20 === 0) console.error(`${rows.length}/${jobs.length}`);
      }
    }),
  );
  await browser.close();
  rows.sort((a, b) => a.themeKey.localeCompare(b.themeKey) || a.route.localeCompare(b.route) || a.width - b.width);
  mkdirSync(path.dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify({ measuredAt: new Date().toISOString(), baseUrl: args.baseUrl, area: args.area, widths: args.widths, rows }, null, 2)}\n`);
  const failed = rows.filter((r) => r.status !== 200).length;
  const violations = {};
  for (const row of rows) for (const code of row.violations ?? []) violations[code] = (violations[code] ?? 0) + 1;
  const pagesWithViolations = rows.filter((r) => (r.violations ?? []).length > 0).length;
  console.log(JSON.stringify({ out: args.out, pages: rows.length, failed, pagesWithViolations, violations }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
