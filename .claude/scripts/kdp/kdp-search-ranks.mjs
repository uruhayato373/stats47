#!/usr/bin/env node
/**
 * KDP 販売中の本が Amazon の Kindle 検索で何番目に出るかを記録する (ログイン不要の公開ページだけを読む)。
 * 検索語は data/products/kdp-listing-copy.json の targetQueries。1 ページ目の順位だけを見る。
 * 読み取れなかった語は status: "unreadable" として残し、「圏外」と混同しない。
 *
 *   node .claude/scripts/kdp/kdp-search-ranks.mjs           # 表示だけ
 *   node .claude/scripts/kdp/kdp-search-ranks.mjs --write   # data/products/kdp-search-ranks/<日付>.json に記録する
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { datasetDir } from "../../../config/datasets.mjs";
import { KDP_LISTINGS, KDP_LISTING_COPY } from "../../../config/paths.mjs";
import { ranksFromResults } from "./lib/kdp-search-ranks.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const WRITE = process.argv.includes("--write");
const WAIT_MS = 2500;

const { listings } = readJson(KDP_LISTINGS);
const copies = readJson(KDP_LISTING_COPY).books;
const asinToId = new Map(Object.entries(listings).filter(([, l]) => l.status === "listed" && l.asin).map(([id, l]) => [l.asin, id]));
const queries = [...new Set(Object.values(copies).flatMap((copy) => copy.targetQueries))].sort();
if (queries.length === 0) throw new Error("検索語が無い (targetQueries)");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ locale: "ja-JP" });
const rows = [];
try {
  for (const query of queries) {
    await page.goto(`https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}&i=digital-text`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(WAIT_MS);
    const results = await page.evaluate(() =>
      [...document.querySelectorAll('[data-component-type="s-search-result"]')].map((element) => element.dataset.asin).filter(Boolean));
    rows.push({ query, status: results.length ? "ok" : "unreadable", resultCount: results.length, ranks: ranksFromResults(results, asinToId) });
    console.log(`${query} | ${results.length} 件 | ${rows.at(-1).ranks.map((r) => `${r.id}#${r.rank}`).join(" ") || "-"}`);
  }
} finally {
  await browser.close();
}

const observedAt = new Date().toISOString();
const unreadable = rows.filter((row) => row.status !== "ok").length;
console.log(`${queries.length} 語 / 読み取れず ${unreadable} / 1 ページ目に出た語 ${rows.filter((row) => row.ranks.length).length}`);
if (WRITE) {
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(observedAt));
  const out = resolve(ROOT, datasetDir("kdp.search-ranks"), `${date}.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({ schemaVersion: 1, observedAt, scope: "kindle-search-first-page", rows }, null, 2)}\n`);
}
