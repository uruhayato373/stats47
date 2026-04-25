#!/usr/bin/env node
/**
 * GSC URL Inspection API 日次測定 + Coverage Drilldown 自動集計 (Phase 8)
 *
 * 対象 URL（約 1,500 件 = sitemap 全件 + KNOWN_RANKING_KEYS + GONE_RANKING_KEYS
 * + GSC pages.csv 上位）の indexability / coverageState / lastCrawlTime を取得し、
 * 以下を出力:
 *
 * 1. URL 単位の生データ:
 *    .claude/state/metrics/gsc/url-inspection/YYYY-MM-DD.csv
 * 2. coverageState 別集計（Coverage Drilldown 相当）:
 *    .claude/state/metrics/gsc/coverage-drilldown/YYYY-Www/{category}-urls.csv
 *    .claude/state/metrics/gsc/coverage-drilldown/LATEST.md
 *    .claude/state/metrics/gsc/coverage-drilldown/history.csv
 * 3. 全体サマリ:
 *    .claude/state/metrics/gsc/url-inspection/LATEST.md
 *    .claude/state/metrics/gsc/url-inspection/history.csv
 *
 * 親 issue #115。Phase 2 (観測短サイクル化) + Phase 8 (Coverage Drilldown API 自動化)。
 *
 * API quota: 2,000 URLs/site/day（公式: developers.google.com/webmaster-tools/v1/limits）
 * → 安全マージン 25% を確保するため 1,500 URL に制限
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

// Phase 8: 対象 URL を 1,500 まで拡張（API quota 2,000/日の 75%）
const MAX_URLS = 1500;
const REQUEST_INTERVAL_MS = 300; // ~200 req/min（quota 効率を保ちつつ 1,500 を約 8 分）

// coverageState (日本語) → Coverage Drilldown カテゴリ ID の mapping
const COVERAGE_STATE_TO_CATEGORY = {
  "見つかりませんでした（404）": "404",
  "サーバーエラー（5xx）": "5xx",
  "ページにリダイレクトがあります": "redirect",
  "代替ページ（適切な canonical タグあり）": "alt-canonical",
  "クロール済み - インデックス未登録": "crawled-not-indexed",
  "重複しています。ユーザーにより、正規ページとして選択されていません": "dup-no-canonical",
  "ソフト 404": "soft-404",
  "ソフト404": "soft-404",
  "検出 - インデックス未登録": "discovered-not-indexed",
  "noindex タグによって除外されました": "noindex-excluded",
  "送信して登録されました": "indexed-submitted",
  "URL が Google に認識されていません": "not-on-google",
};

const CATEGORY_LABELS = {
  "404": "見つかりませんでした (404)",
  "5xx": "サーバーエラー (5xx)",
  "redirect": "ページにリダイレクトがあります",
  "alt-canonical": "代替ページ (canonical 適切)",
  "crawled-not-indexed": "クロール済み - インデックス未登録",
  "dup-no-canonical": "重複 (user canonical なし)",
  "soft-404": "ソフト 404",
  "discovered-not-indexed": "検出 - インデックス未登録",
  "noindex-excluded": "noindex で除外",
  "indexed-submitted": "登録済み (送信)",
  "not-on-google": "Google 未認識",
};

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

function loadKeysFromTsFile(filename) {
  const p = path.join(PROJECT_ROOT, "apps/web/src/config", filename);
  if (!fs.existsSync(p)) return [];
  const txt = fs.readFileSync(p, "utf-8");
  const matches = txt.match(/"([a-z0-9-]+)"/g) || [];
  return matches.map((m) => m.slice(1, -1));
}

function buildUrlList() {
  // Phase 8: sitemap 全件 + KNOWN_RANKING_KEYS 全件 + GONE_RANKING_KEYS（旧 URL 観測用）
  // + GSC pages.csv の URL（観測されている URL を優先補完）
  // 重複排除後に MAX_URLS で切る
  const ordered = []; // 優先度順

  // Priority 1: GSC pages.csv 全件（観測対象 URL を最優先）
  const snapshotDir = getLatestSnapshotDir();
  if (snapshotDir) {
    const pagesCsv = path.join(snapshotDir, "pages.csv");
    if (fs.existsSync(pagesCsv)) {
      const pages = readCsv(pagesCsv)
        .map((r) => ({
          url: r.page,
          impressions: parseInt(r.impressions, 10) || 0,
        }))
        .sort((a, b) => b.impressions - a.impressions);
      for (const p of pages) ordered.push(p.url);
      log(`P1: Added ${pages.length} URLs from pages.csv`);
    }
  }

  // Priority 2: 主要静的ページ
  const staticPages = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/about`,
    `${SITE_ORIGIN}/themes`,
    `${SITE_ORIGIN}/categories`,
    `${SITE_ORIGIN}/areas`,
    `${SITE_ORIGIN}/ranking`,
    `${SITE_ORIGIN}/blog`,
    `${SITE_ORIGIN}/search`,
  ];
  for (const u of staticPages) ordered.push(u);

  // Priority 3: 47 都道府県 /areas/{prefCode} (47)
  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0") + "000";
    ordered.push(`${SITE_ORIGIN}/areas/${code}`);
  }

  // Priority 4: KNOWN_RANKING_KEYS 全件（active な ranking URL）
  const knownKeys = loadKeysFromTsFile("known-ranking-keys.ts");
  for (const k of knownKeys) {
    ordered.push(`${SITE_ORIGIN}/ranking/${k}`);
  }
  log(`P4: Added ${knownKeys.length} URLs from KNOWN_RANKING_KEYS`);

  // Priority 5: GONE_RANKING_KEYS（旧 URL の観測 — 410 化が Google に認識されているか）
  const goneKeys = loadKeysFromTsFile("gone-ranking-keys.ts");
  for (const k of goneKeys) {
    ordered.push(`${SITE_ORIGIN}/ranking/${k}`);
  }
  log(`P5: Added ${goneKeys.length} URLs from GONE_RANKING_KEYS`);

  // Priority 6: KNOWN_TAG_KEYS
  const tagKeys = loadKeysFromTsFile("known-tag-keys.ts");
  for (const k of tagKeys) {
    ordered.push(`${SITE_ORIGIN}/tag/${k}`);
  }
  log(`P6: Added ${tagKeys.length} URLs from KNOWN_TAG_KEYS`);

  // 重複排除（順序保持）+ MAX_URLS で切る
  const seen = new Set();
  const result = [];
  for (const u of ordered) {
    if (!seen.has(u)) {
      seen.add(u);
      result.push(u);
    }
    if (result.length >= MAX_URLS) break;
  }
  log(
    `Total: ${result.length} URLs (capped at MAX_URLS=${MAX_URLS}, raw ${ordered.length})`,
  );
  return result;
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

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
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

  // history.csv: append daily counts（日本語 coverageState キー対応）
  const historyPath = path.join(outDir, "history.csv");
  const passCount = summary.verdictCounts["PASS"] || 0;
  const failCount = summary.verdictCounts["FAIL"] || 0;
  const partialCount = summary.verdictCounts["PARTIAL"] || 0;
  const neutralCount = summary.verdictCounts["NEUTRAL"] || 0;
  const indexedCount =
    (summary.counts["送信して登録されました"] || 0) +
    (summary.counts["URL is on Google"] || 0);
  const crawledNotIndexed =
    (summary.counts["クロール済み - インデックス未登録"] || 0) +
    (summary.counts["Crawled - currently not indexed"] || 0);
  const headerLine =
    "date,total,pass,fail,partial,neutral,indexed,crawled_not_indexed\n";
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, headerLine);
  }
  const line = `${dateStr},${summary.total},${passCount},${failCount},${partialCount},${neutralCount},${indexedCount},${crawledNotIndexed}\n`;
  fs.appendFileSync(historyPath, line);
  log(`Appended to history.csv`);

  // Phase 8: Coverage Drilldown 自動集計
  writeCoverageDrilldown(rows, dateStr);

  console.log(latest);
}

/**
 * Phase 8: Coverage Drilldown 相当のカテゴリ別 URL リストを生成
 *
 * 入力: URL Inspection の rows (url, coverageState, lastCrawlTime, ...)
 * 出力:
 *   .claude/state/metrics/gsc/coverage-drilldown/YYYY-Www/{category}-urls.csv
 *   .claude/state/metrics/gsc/coverage-drilldown/LATEST.md
 *   .claude/state/metrics/gsc/coverage-drilldown/history.csv
 */
function writeCoverageDrilldown(rows, dateStr) {
  const week = isoWeek(new Date(dateStr));
  const drilldownBase = path.join(
    PROJECT_ROOT,
    ".claude/state/metrics/gsc/coverage-drilldown",
  );
  const weekDir = path.join(drilldownBase, week);
  fs.mkdirSync(weekDir, { recursive: true });

  // coverageState 別に rows をグルーピング
  const byCategory = {};
  const unmappedStates = new Set();
  for (const r of rows) {
    const state = r.coverageState;
    if (!state) continue;
    const categoryId = COVERAGE_STATE_TO_CATEGORY[state];
    if (!categoryId) {
      unmappedStates.add(state);
      continue;
    }
    if (!byCategory[categoryId]) byCategory[categoryId] = [];
    byCategory[categoryId].push({
      url: r.url,
      lastCrawlTime: r.lastCrawlTime,
    });
  }

  if (unmappedStates.size > 0) {
    log(
      `[drilldown] WARNING: 未マッピング coverageState: ${[...unmappedStates].join(", ")}`,
    );
  }

  // カテゴリ別 CSV 書き出し
  const counts = {};
  for (const [categoryId, items] of Object.entries(byCategory)) {
    const csv =
      "URL,前回のクロール\n" +
      items
        .map(
          (i) =>
            `${i.url},${i.lastCrawlTime ? i.lastCrawlTime.slice(0, 10) : ""}`,
        )
        .join("\n") +
      "\n";
    const dst = path.join(weekDir, `${categoryId}-urls.csv`);
    fs.writeFileSync(dst, csv);
    counts[categoryId] = items.length;
  }

  // summary.json
  const summary = {
    week,
    source: "url-inspection-api (Phase 8 自動)",
    fetched_at: new Date().toISOString(),
    counts,
    sample_limit_per_category: null,
    sample_note:
      "URL Inspection API で自分が指定した URL の coverageState 集計。GSC UI Drilldown と異なり 1000 件上限なし、ただし「自分が把握する URL」に限定（未把握 URL は対象外）",
    inspected_url_count: rows.length,
  };
  fs.writeFileSync(
    path.join(weekDir, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  log(`[drilldown] Wrote ${week}/ (${Object.keys(byCategory).length} categories)`);

  // history.csv (週単位)
  const historyPath = path.join(drilldownBase, "history.csv");
  const cols = [
    "week",
    "total_count",
    "count_404",
    "count_5xx",
    "count_redirect",
    "count_alt_canonical",
    "count_dup_no_canonical",
    "count_soft_404",
    "count_crawled_not_indexed",
    "count_discovered_not_indexed",
    "count_noindex_excluded",
    "count_indexed_submitted",
    "count_not_on_google",
    "full_count_estimate_total",
    "source",
    "fetched_at",
  ];
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const fetchedAt = new Date().toISOString();
  const newRow = [
    week,
    totalCount,
    counts["404"] || 0,
    counts["5xx"] || 0,
    counts.redirect || 0,
    counts["alt-canonical"] || 0,
    counts["dup-no-canonical"] || 0,
    counts["soft-404"] || 0,
    counts["crawled-not-indexed"] || 0,
    counts["discovered-not-indexed"] || 0,
    counts["noindex-excluded"] || 0,
    counts["indexed-submitted"] || 0,
    counts["not-on-google"] || 0,
    "",
    "url-inspection-api",
    fetchedAt,
  ].join(",");

  let lines = [];
  if (fs.existsSync(historyPath)) {
    const existing = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
    const headerLine = cols.join(",");
    const rest = existing
      .slice(1)
      .filter((l) => l && !l.startsWith(`${week},`))
      .map((l) => {
        const colsCount = l.split(",").length;
        if (colsCount < cols.length) {
          return l + ",".repeat(cols.length - colsCount);
        }
        return l;
      });
    lines = [headerLine, ...rest, newRow];
  } else {
    lines = [cols.join(","), newRow];
  }
  fs.writeFileSync(historyPath, lines.join("\n") + "\n");
  log(`[drilldown] history.csv updated`);

  // LATEST.md (前週比含む)
  let prev = null;
  if (fs.existsSync(historyPath)) {
    const existingLines = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
    const header = existingLines[0].split(",");
    const rows2 = existingLines.slice(1).map((l) => {
      const c = l.split(",");
      const obj = {};
      header.forEach((h, i) => (obj[h] = c[i]));
      return obj;
    });
    prev = rows2.filter((r) => r.week !== week).pop() || null;
  }

  const mdLines = [];
  mdLines.push(`# GSC Coverage Drilldown — ${week}`);
  mdLines.push("");
  mdLines.push(`**取得日**: ${dateStr} / **ソース**: URL Inspection API (Phase 8 自動)`);
  mdLines.push(`**inspect 件数**: ${rows.length} URL`);
  mdLines.push("");
  mdLines.push("## カテゴリ別件数（前週比）");
  mdLines.push("");
  mdLines.push("| カテゴリ | 今週 | 前週 | 変化 |");
  mdLines.push("|---|---:|---:|---|");
  for (const id of Object.keys(CATEGORY_LABELS)) {
    if (counts[id] === undefined) continue;
    const cur = counts[id];
    const pCol = `count_${id.replace(/-/g, "_")}`;
    const prevVal = prev ? Number(prev[pCol]) || 0 : null;
    const delta =
      prevVal === null
        ? "—"
        : cur - prevVal > 0
          ? `▲ +${cur - prevVal}`
          : cur - prevVal < 0
            ? `▼ ${cur - prevVal}`
            : "· ±0";
    mdLines.push(
      `| ${CATEGORY_LABELS[id]} | ${cur} | ${prevVal === null ? "—" : prevVal} | ${delta} |`,
    );
  }
  const prevTotal = prev ? Number(prev.total_count) || 0 : null;
  const totalDelta =
    prevTotal === null
      ? "—"
      : totalCount - prevTotal > 0
        ? `▲ +${totalCount - prevTotal}`
        : totalCount - prevTotal < 0
          ? `▼ ${totalCount - prevTotal}`
          : "· ±0";
  mdLines.push(
    `| **合計** | **${totalCount}** | ${prevTotal === null ? "—" : prevTotal} | ${totalDelta} |`,
  );
  mdLines.push("");
  mdLines.push("## 注意");
  mdLines.push("");
  mdLines.push(
    "- 本データは URL Inspection API で **自分が指定した URL（sitemap + KNOWN + GONE）** の coverageState を集計したもの",
  );
  mdLines.push(
    "- GSC UI Coverage Report の Drilldown とは「対象 URL 集合」が異なる（GSC UI は Google 独自視点で発見した URL も含む、API は自分視点のみ）",
  );
  mdLines.push(
    "- 「未把握 URL」（古い旧 URL 等）は API では取得不能。GSC UI 集計値（例: 全 404 件数）と合わせて読む",
  );
  mdLines.push("");
  mdLines.push("## 詳細");
  mdLines.push("");
  mdLines.push(`- 今週の URL リスト: \`${week}/\` 配下`);
  mdLines.push(`- 時系列集約: \`history.csv\``);
  mdLines.push("- 自動取得スクリプト: `node .claude/scripts/gsc/url-inspection-daily.cjs`");
  mdLines.push("- GitHub Actions: `.github/workflows/gsc-url-inspection-daily.yml` (毎朝 JST 06:00)");
  mdLines.push("");
  fs.writeFileSync(path.join(drilldownBase, "LATEST.md"), mdLines.join("\n"));
  log(`[drilldown] LATEST.md updated`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
