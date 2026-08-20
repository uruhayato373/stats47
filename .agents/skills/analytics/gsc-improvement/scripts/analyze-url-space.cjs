#!/usr/bin/env node
/**
 * URL 空間差分スクリプト
 *
 * 本番 sitemap.xml と GSC pages.csv を突合して以下 3 カテゴリを出力:
 * - A (both): sitemap あり & Google 認識あり（健全）
 * - B (google only): sitemap なし & Google 認識あり（**過去残骸、T0 対策対象**）
 * - C (sitemap only): sitemap あり & Google 認識なし（未クロール or 未登録）
 *
 * 使い方:
 *   node .claude/skills/analytics/gsc-improvement/scripts/analyze-url-space.cjs [YYYY-Www]
 *
 * 出力:
 *   .claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/url-space-diff.csv
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const SITE_URL = "https://stats47.jp";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// 引数から YYYY-Www を取得、省略時は reference/snapshots/ 配下の最新を採用
function resolveWeekArg() {
  const arg = process.argv[2];
  if (arg && /^\d{4}-W\d{2}$/.test(arg)) return arg;
  const snapDir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots"
  );
  if (!fs.existsSync(snapDir)) throw new Error(`snapshots directory not found: ${snapDir}`);
  const weeks = fs.readdirSync(snapDir)
    .filter(n => /^\d{4}-W\d{2}$/.test(n))
    .sort((a, b) => b.localeCompare(a));
  if (weeks.length === 0) throw new Error("no snapshot weeks found");
  return weeks[0];
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "stats47-url-space-analyzer/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(fetchText(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`fetch ${url} → ${res.statusCode}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

function extractUrlsFromSitemap(xml) {
  // sitemap index か通常 sitemap かを判別
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const urlRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  const urls = [];
  let m;
  while ((m = urlRegex.exec(xml)) !== null) urls.push(m[1]);
  return { urls, isIndex };
}

async function fetchAllSitemapUrls() {
  const xml = await fetchText(SITEMAP_URL);
  const { urls: firstUrls, isIndex } = extractUrlsFromSitemap(xml);
  if (!isIndex) return firstUrls;
  // sitemap index なら各サブ sitemap を順次取得
  const all = [];
  for (const subUrl of firstUrls) {
    try {
      const subXml = await fetchText(subUrl);
      const { urls } = extractUrlsFromSitemap(subXml);
      all.push(...urls);
    } catch (e) {
      console.warn(`[warn] sub sitemap fetch failed: ${subUrl} (${e.message})`);
    }
  }
  return all;
}

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const fields = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === "," && !inQuotes) { fields.push(cur); cur = ""; continue; }
      cur += c;
    }
    fields.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, fields[i]]));
  });
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    // scheme + host + pathname のみ（searchParams と fragment は捨てる）
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || `${u.protocol}//${u.host}/`;
  } catch {
    return url;
  }
}

function categorize(url) {
  const u = url.replace(/^https?:\/\/[^\/]+/, "");
  if (u === "/" || u === "") return "home";
  if (u.startsWith("/ranking/")) return "ranking/detail";
  if (u === "/ranking") return "ranking/index";
  if (u.startsWith("/blog/")) return "blog/detail";
  if (u === "/blog") return "blog/index";
  if (/^\/areas\/\d+\/cities\//.test(u)) return "areas/cities";
  if (/^\/areas\/\d+\/[a-z]+/.test(u)) return "areas/category";
  if (/^\/areas\/\d+$/.test(u)) return "areas/prefecture";
  if (u === "/areas") return "areas/index";
  if (u.startsWith("/themes/")) return "themes/detail";
  if (u === "/themes") return "themes/index";
  if (u.startsWith("/category/")) return "category";
  if (u.startsWith("/subcategory/")) return "subcategory";
  if (u.startsWith("/tag/")) return "tag";
  if (u.startsWith("/survey/")) return "survey";
  if (u.startsWith("/compare/")) return "compare";
  if (u.startsWith("/correlation")) return "correlation";
  if (u.startsWith("/dashboard/")) return "dashboard";
  if (u.startsWith("/search")) return "search";
  return "other";
}

function esc(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const week = resolveWeekArg();
  console.log(`[url-space-diff] analyzing week=${week}`);

  const snapDir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
    week
  );
  const pagesCsv = path.join(snapDir, "pages.csv");
  if (!fs.existsSync(pagesCsv)) {
    throw new Error(`pages.csv not found: ${pagesCsv}`);
  }

  console.log(`[url-space-diff] fetching sitemap from ${SITEMAP_URL}`);
  const sitemapRawUrls = await fetchAllSitemapUrls();
  const sitemapSet = new Set(sitemapRawUrls.map(normalizeUrl));
  console.log(`  sitemap URL count: ${sitemapSet.size}`);

  console.log(`[url-space-diff] reading pages.csv`);
  const pages = parseCSV(fs.readFileSync(pagesCsv, "utf-8"));
  const googleUrlData = new Map();
  for (const row of pages) {
    const norm = normalizeUrl(row.page);
    const clicks = parseInt(row.clicks) || 0;
    const impr = parseInt(row.impressions) || 0;
    if (googleUrlData.has(norm)) {
      const existing = googleUrlData.get(norm);
      existing.clicks += clicks;
      existing.impressions += impr;
    } else {
      googleUrlData.set(norm, { clicks, impressions: impr });
    }
  }
  console.log(`  Google 認識 URL count: ${googleUrlData.size}`);

  // 差分計算
  const both = [];
  const googleOnly = [];
  const sitemapOnly = [];

  for (const url of googleUrlData.keys()) {
    if (sitemapSet.has(url)) {
      both.push({ url, ...googleUrlData.get(url) });
    } else {
      googleOnly.push({ url, ...googleUrlData.get(url) });
    }
  }
  for (const url of sitemapSet) {
    if (!googleUrlData.has(url)) {
      sitemapOnly.push({ url, clicks: 0, impressions: 0 });
    }
  }

  // カテゴリ別集計
  const categorizeList = (items) => {
    const byCat = {};
    for (const item of items) {
      const cat = categorize(item.url);
      if (!byCat[cat]) byCat[cat] = { count: 0, clicks: 0, impressions: 0 };
      byCat[cat].count++;
      byCat[cat].clicks += item.clicks;
      byCat[cat].impressions += item.impressions;
    }
    return byCat;
  };

  // CSV 出力
  const outPath = path.join(snapDir, "url-space-diff.csv");
  const allRows = [
    ...googleOnly.map(r => ({ category: "B_google_only", url: r.url, clicks: r.clicks, impressions: r.impressions, action_hint: "T0 対策候補（sitemap 外だが Google 認識中 = 過去残骸）" })),
    ...sitemapOnly.map(r => ({ category: "C_sitemap_only", url: r.url, clicks: r.clicks, impressions: r.impressions, action_hint: "未クロール or 検出未登録（内部リンク強化検討）" })),
    ...both.map(r => ({ category: "A_both", url: r.url, clicks: r.clicks, impressions: r.impressions, action_hint: "健全" })),
  ];
  const headers = ["category", "url", "clicks", "impressions", "action_hint"];
  const csv = [headers.join(","), ...allRows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n") + "\n";
  fs.writeFileSync(outPath, csv);

  // サマリログ
  console.log("");
  console.log("=== URL 空間差分サマリ ===");
  console.log(`A_both (健全):         ${both.length} URL`);
  console.log(`B_google_only (残骸):  ${googleOnly.length} URL ← T0 対策対象`);
  console.log(`C_sitemap_only (未):   ${sitemapOnly.length} URL`);

  console.log("\n=== B_google_only のカテゴリ別内訳（T0 対策優先度） ===");
  const bByCat = categorizeList(googleOnly);
  console.log("| カテゴリ | URL数 | clicks | impressions |");
  console.log("|---|---|---|---|");
  Object.entries(bByCat)
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .forEach(([cat, s]) => {
      console.log(`| ${cat} | ${s.count} | ${s.clicks} | ${s.impressions.toLocaleString()} |`);
    });

  console.log("\n=== C_sitemap_only のカテゴリ別内訳 ===");
  const cByCat = categorizeList(sitemapOnly);
  console.log("| カテゴリ | URL数 |");
  console.log("|---|---|");
  Object.entries(cByCat)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([cat, s]) => {
      console.log(`| ${cat} | ${s.count} |`);
    });

  console.log(`\n[url-space-diff] saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
