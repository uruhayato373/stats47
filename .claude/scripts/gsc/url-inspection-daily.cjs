#!/usr/bin/env node
/**
 * GSC URL Inspection API 日次測定
 *
 * 対象 URL（約 300 件）の indexability / coverageState / lastCrawlTime を取得し、
 * .claude/state/metrics/gsc/url-inspection/YYYY-MM-DD.csv に保存。
 * LATEST.md にサマリ生成、history.csv に集計履歴を append。
 *
 * 親 issue #115 の Phase 2: 観測短サイクル化（A 案）の中核スクリプト。
 *
 * 使い方:
 *   node .claude/scripts/gsc/url-inspection-daily.cjs               # 全実行
 *   node .claude/scripts/gsc/url-inspection-daily.cjs --dry-run     # URL リストだけ表示
 *   node .claude/scripts/gsc/url-inspection-daily.cjs --limit 5     # 5 URL だけ inspect
 *
 * 認証: サービスアカウント鍵（リポジトリルートの stats47-*.json）
 * scope: https://www.googleapis.com/auth/webmasters.readonly
 */

const path = require("node:path");
const fs = require("node:fs");
const { google } = require("googleapis");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const SITE_URL = "sc-domain:stats47.jp";
const SITE_ORIGIN = "https://stats47.jp";
const KEY_CANDIDATES = [
  "stats47-f6b5dae19196.json",
  "stats47-31b18ee67144.json",
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LIMIT_ARG = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : null;
})();

const TOP_PAGES = 200;
const TOP_RANKING_KEYS = 100;
const REQUEST_INTERVAL_MS = 250; // ~240 req/min, < 600 req/min limit

function log(msg) {
  process.stderr.write(`[url-inspection] ${msg}\n`);
}

function findKeyFile() {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (jsonEnv) {
    const dir = path.join(require("node:os").tmpdir(), "stats47-sa");
    fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, "service-account.json");
    fs.writeFileSync(p, jsonEnv, { mode: 0o600 });
    return p;
  }
  for (const name of KEY_CANDIDATES) {
    const p = path.join(PROJECT_ROOT, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Service account key not found. Set GOOGLE_SERVICE_ACCOUNT_KEY_JSON env or place ${KEY_CANDIDATES.join(" / ")} at ${PROJECT_ROOT}`,
  );
}

function readCsv(filePath) {
  const txt = fs.readFileSync(filePath, "utf-8");
  const lines = txt.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i];
    });
    return row;
  });
}

function getLatestSnapshotDir() {
  const dir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  );
  if (!fs.existsSync(dir)) return null;
  const weeks = fs
    .readdirSync(dir)
    .filter((n) => /^\d{4}-W\d{2}$/.test(n))
    .sort()
    .reverse();
  return weeks[0] ? path.join(dir, weeks[0]) : null;
}

function loadKnownRankingKeys() {
  const p = path.join(
    PROJECT_ROOT,
    "apps/web/src/config/known-ranking-keys.ts",
  );
  const txt = fs.readFileSync(p, "utf-8");
  const matches = txt.match(/"([a-z0-9-]+)"/g) || [];
  return matches.map((m) => m.slice(1, -1));
}

function buildUrlList() {
  const urls = new Set();

  const snapshotDir = getLatestSnapshotDir();
  if (snapshotDir) {
    const pagesCsv = path.join(snapshotDir, "pages.csv");
    if (fs.existsSync(pagesCsv)) {
      const pages = readCsv(pagesCsv)
        .map((r) => ({
          url: r.page,
          impressions: parseInt(r.impressions, 10) || 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, TOP_PAGES);
      for (const p of pages) urls.add(p.url);
      log(`Added ${pages.length} URLs from pages.csv (top ${TOP_PAGES})`);
    }
  } else {
    log("No GSC snapshot found, skipping pages.csv");
  }

  // KNOWN_RANKING_KEYS の上位 N（pages.csv にない ranking URL を補完）
  const rankingKeys = loadKnownRankingKeys().slice(0, TOP_RANKING_KEYS);
  let added = 0;
  for (const k of rankingKeys) {
    const u = `${SITE_ORIGIN}/ranking/${k}`;
    if (!urls.has(u)) {
      urls.add(u);
      added++;
    }
  }
  log(`Added ${added} ranking URLs from KNOWN_RANKING_KEYS`);

  // 主要静的ページ
  const staticPages = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/about`,
    `${SITE_ORIGIN}/themes`,
    `${SITE_ORIGIN}/categories`,
  ];
  for (const u of staticPages) urls.add(u);

  return Array.from(urls);
}

async function inspect(searchconsole, inspectionUrl) {
  const res = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl: SITE_URL,
      languageCode: "ja-JP",
    },
  });
  const r = res.data.inspectionResult || {};
  const idx = r.indexStatusResult || {};
  return {
    url: inspectionUrl,
    verdict: idx.verdict || "",
    coverageState: idx.coverageState || "",
    indexingState: idx.indexingState || "",
    robotsTxtState: idx.robotsTxtState || "",
    lastCrawlTime: idx.lastCrawlTime || "",
    pageFetchState: idx.pageFetchState || "",
    googleCanonical: idx.googleCanonical || "",
    userCanonical: idx.userCanonical || "",
    crawledAs: idx.crawledAs || "",
    referringUrls: (idx.referringUrls || []).length,
  };
}

function escCsv(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, headers) {
  return (
    [headers.join(",")]
      .concat(rows.map((r) => headers.map((h) => escCsv(r[h])).join(",")))
      .join("\n") + "\n"
  );
}

function summarize(rows) {
  const total = rows.length;
  const counts = {};
  for (const r of rows) {
    const cs = r.coverageState || "(unknown)";
    counts[cs] = (counts[cs] || 0) + 1;
  }
  const verdictCounts = {};
  for (const r of rows) {
    const v = r.verdict || "(unknown)";
    verdictCounts[v] = (verdictCounts[v] || 0) + 1;
  }
  return { total, counts, verdictCounts };
}

function writeLatest(dateStr, summary, prevSummary) {
  const lines = [];
  lines.push(`# GSC URL Inspection — ${dateStr}`);
  lines.push("");
  lines.push(`**対象 URL 数**: ${summary.total}`);
  lines.push("");
  lines.push("## Verdict 内訳");
  lines.push("");
  lines.push("| Verdict | 件数 | 前日比 |");
  lines.push("|---|---|---|");
  const allVerdicts = new Set([
    ...Object.keys(summary.verdictCounts),
    ...Object.keys(prevSummary?.verdictCounts || {}),
  ]);
  for (const v of [...allVerdicts].sort()) {
    const cur = summary.verdictCounts[v] || 0;
    const prev = prevSummary?.verdictCounts?.[v] || 0;
    const delta = prevSummary
      ? cur - prev > 0
        ? `+${cur - prev}`
        : cur - prev < 0
          ? `${cur - prev}`
          : "±0"
      : "—";
    lines.push(`| ${v} | ${cur} | ${delta} |`);
  }
  lines.push("");
  lines.push("## CoverageState 内訳");
  lines.push("");
  lines.push("| CoverageState | 件数 | 前日比 |");
  lines.push("|---|---|---|");
  const allStates = new Set([
    ...Object.keys(summary.counts),
    ...Object.keys(prevSummary?.counts || {}),
  ]);
  for (const s of [...allStates].sort()) {
    const cur = summary.counts[s] || 0;
    const prev = prevSummary?.counts?.[s] || 0;
    const delta = prevSummary
      ? cur - prev > 0
        ? `+${cur - prev}`
        : cur - prev < 0
          ? `${cur - prev}`
          : "±0"
      : "—";
    lines.push(`| ${s} | ${cur} | ${delta} |`);
  }
  lines.push("");
  lines.push(
    `_詳細 CSV: \`.claude/state/metrics/gsc/url-inspection/${dateStr}.csv\`_`,
  );
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = path.join(
    PROJECT_ROOT,
    ".claude/state/metrics/gsc/url-inspection",
  );
  fs.mkdirSync(outDir, { recursive: true });

  let urls = buildUrlList();
  if (LIMIT_ARG) urls = urls.slice(0, LIMIT_ARG);
  log(`Total URLs to inspect: ${urls.length}`);

  if (DRY_RUN) {
    log("DRY-RUN: showing first 20 URLs");
    urls.slice(0, 20).forEach((u) => console.log(u));
    return;
  }

  const keyFile = findKeyFile();
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const rows = [];
  let i = 0;
  for (const url of urls) {
    i++;
    try {
      const r = await inspect(searchconsole, url);
      rows.push(r);
      if (i % 25 === 0 || i === urls.length) {
        log(`  ${i}/${urls.length} done`);
      }
    } catch (e) {
      log(`  ERROR ${url}: ${e.message}`);
      rows.push({
        url,
        verdict: "ERROR",
        coverageState: e.message.slice(0, 100),
      });
    }
    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL_MS));
  }

  const csvHeaders = [
    "url",
    "verdict",
    "coverageState",
    "indexingState",
    "robotsTxtState",
    "lastCrawlTime",
    "pageFetchState",
    "googleCanonical",
    "userCanonical",
    "crawledAs",
    "referringUrls",
  ];
  const csv = toCsv(rows, csvHeaders);
  const csvPath = path.join(outDir, `${dateStr}.csv`);
  fs.writeFileSync(csvPath, csv);
  log(`Wrote ${csvPath}`);

  const summary = summarize(rows);

  // 前日 summary を読む
  let prevSummary = null;
  const prevDates = fs
    .readdirSync(outDir)
    .filter((n) => /^\d{4}-\d{2}-\d{2}\.csv$/.test(n))
    .filter((n) => n !== `${dateStr}.csv`)
    .sort()
    .reverse();
  if (prevDates[0]) {
    const prevRows = readCsv(path.join(outDir, prevDates[0]));
    prevSummary = summarize(prevRows);
  }

  const latest = writeLatest(dateStr, summary, prevSummary);
  fs.writeFileSync(path.join(outDir, "LATEST.md"), latest);
  log(`Wrote LATEST.md`);

  // history.csv: append daily counts
  const historyPath = path.join(outDir, "history.csv");
  const passCount = summary.verdictCounts["PASS"] || 0;
  const failCount = summary.verdictCounts["FAIL"] || 0;
  const partialCount = summary.verdictCounts["PARTIAL"] || 0;
  const neutralCount = summary.verdictCounts["NEUTRAL"] || 0;
  const indexedCount = summary.counts["URL is on Google"] || 0;
  const crawledNotIndexed =
    summary.counts["Crawled - currently not indexed"] || 0;
  const headerLine =
    "date,total,pass,fail,partial,neutral,indexed,crawled_not_indexed\n";
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, headerLine);
  }
  const line = `${dateStr},${summary.total},${passCount},${failCount},${partialCount},${neutralCount},${indexedCount},${crawledNotIndexed}\n`;
  fs.appendFileSync(historyPath, line);
  log(`Appended to history.csv`);

  console.log(latest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
