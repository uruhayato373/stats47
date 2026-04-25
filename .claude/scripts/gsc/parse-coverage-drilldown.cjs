#!/usr/bin/env node
/**
 * GSC Coverage Drilldown 週次解析・継続記録
 *
 * GSC UI で取得した 6 種別 zip / CSV を `.claude/state/metrics/gsc/coverage-drilldown/`
 * に継続保存する。Phase 7（親 issue #115 / issue #43 配下）の中核スクリプト。
 *
 * 入力（優先順）:
 *   1. ~/Downloads/stats47.jp-Coverage-Drilldown-YYYY-MM-DD*.zip （6 zip、未実装、v2 で対応）
 *   2. gcsエラー/{404,5xx,redirect,alt-canonical,dup-no-canonical,soft-404}.csv （fallback）
 *
 * 出力:
 *   .claude/state/metrics/gsc/coverage-drilldown/
 *   ├ LATEST.md                          人間が 10 秒で「今週の変化」を把握
 *   ├ history.csv                        週次集約（agent 解析用）
 *   └ YYYY-Www/
 *     ├ {category}-urls.csv (6 file)     URL,前回のクロール の 2 列に統一
 *     └ summary.json                     week, source, fetched_at, counts
 *
 * 使い方:
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs                            # 自動検出
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs --week 2026-W17 --source gcsエラー
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs --dry-run                  # 計画表示のみ
 *
 * 設計原則:
 *   - 冪等性: 同じ入力なら 2 回実行しても同じ結果（mtime 比較で skip）
 *   - スキーマ正規化: 全カテゴリ「URL,前回のクロール」の 2 列に統一
 *   - 取得失敗時アラート: stderr + exit 1
 *   - 過去事故 B（Downloads 放置による消失）対策: 入力検出後すぐに保存
 */

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT_BASE = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/gsc/coverage-drilldown",
);
const GCS_ERROR_DIR = path.join(PROJECT_ROOT, "gcsエラー");
const DOWNLOADS = path.join(os.homedir(), "Downloads");

// 6 カテゴリの定義（GSC UI のラベル ↔ 内部 ID）
const CATEGORIES = [
  { id: "404", label: "見つかりませんでした (404)" },
  { id: "5xx", label: "サーバーエラー (5xx)" },
  { id: "redirect", label: "ページにリダイレクトがあります" },
  { id: "alt-canonical", label: "代替ページ (canonical 適切)" },
  { id: "dup-no-canonical", label: "重複 (user canonical なし)" },
  { id: "soft-404", label: "ソフト 404" },
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WEEK_ARG = (() => {
  const i = args.indexOf("--week");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const SOURCE_ARG = (() => {
  const i = args.indexOf("--source");
  return i >= 0 && args[i + 1] ? args[i + 1] : null; // "gcsエラー" or "downloads"
})();

function log(msg) {
  process.stderr.write(`[coverage-drilldown] ${msg}\n`);
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function detectSource() {
  if (SOURCE_ARG === "gcsエラー") return "gcsエラー";
  if (SOURCE_ARG === "downloads") return "downloads";

  // 自動検出: Downloads の zip 優先、なければ gcsエラー
  const dlZips = fs.existsSync(DOWNLOADS)
    ? fs
        .readdirSync(DOWNLOADS)
        .filter((n) =>
          /^stats47\.jp-Coverage-Drilldown-\d{4}-\d{2}-\d{2}.*\.zip$/.test(n),
        )
    : [];
  if (dlZips.length > 0) {
    log(`Downloads zip detected: ${dlZips.length} files (NOT YET SUPPORTED in v1)`);
    log("Falling back to gcsエラー/");
  }

  if (
    fs.existsSync(GCS_ERROR_DIR) &&
    CATEGORIES.every((c) =>
      fs.existsSync(path.join(GCS_ERROR_DIR, `${c.id}.csv`)),
    )
  ) {
    return "gcsエラー";
  }

  log("ERROR: 入力ソースが見つかりません");
  log("[手順]");
  log("  1. Google Search Console → カバレッジ → エラーカテゴリ → ドリルダウン → エクスポート");
  log("  2. 6 カテゴリ全て (404, 5xx, redirect, alt-canonical, dup-no-canonical, soft-404) を取得");
  log("  3. zip を解凍して gcsエラー/{category}.csv に配置 (zip 自動解析は v2 で対応予定)");
  log("  4. 本コマンドを再実行");
  process.exit(1);
}

function readCsvNormalized(csvPath, categoryId) {
  // CSV 読み込み + URL,前回のクロール の 2 列に正規化
  const raw = fs.readFileSync(csvPath, "utf-8");
  // BOM 除去
  const text = raw.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error(`Empty CSV: ${csvPath}`);
  }
  const header = lines[0].split(",");
  const urlIdx = header.findIndex((h) => h.trim() === "URL");
  const dateIdx = header.findIndex((h) => h.trim() === "前回のクロール");
  if (urlIdx < 0 || dateIdx < 0) {
    throw new Error(
      `Unexpected header in ${categoryId}: ${header.join(",")} (expected URL + 前回のクロール)`,
    );
  }

  const out = ["URL,前回のクロール"];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(",");
    const url = (cols[urlIdx] || "").trim();
    const date = (cols[dateIdx] || "").trim();
    if (!url) continue;
    out.push(`${url},${date}`);
  }
  return out.join("\n") + "\n";
}

function writeIfChanged(filePath, content) {
  // 冪等性: 同じ内容なら skip
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf-8");
    if (existing === content) return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function buildSummaryJson(week, source, counts, sourceMtime) {
  return JSON.stringify(
    {
      week,
      source,
      source_mtime: new Date(sourceMtime).toISOString(),
      fetched_at: new Date().toISOString(),
      counts,
      sample_limit_per_category: 1000,
      full_count_estimate_total: null,
      full_count_estimate_note:
        "GSC UI のカバレッジレポート集計値を手入力。例: 404=5919, 5xx=2041 など",
    },
    null,
    2,
  ) + "\n";
}

function loadPrevSummary(week) {
  // history.csv から前週を引く (週は ISO Week なので prev は YYYY-Www-1)
  const historyPath = path.join(OUT_BASE, "history.csv");
  if (!fs.existsSync(historyPath)) return null;
  const lines = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
  if (lines.length < 2) return null;
  const header = lines[0].split(",");
  const rows = lines.slice(1).map((l) => {
    const cols = l.split(",");
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = cols[i];
    });
    return obj;
  });
  // 同じ week 以外の最新を返す
  const prev = rows.filter((r) => r.week !== week).pop();
  return prev || null;
}

function deltaSymbol(cur, prev) {
  if (prev === undefined || prev === null) return "—";
  const diff = cur - prev;
  if (diff > 0) return `▲ +${diff}`;
  if (diff < 0) return `▼ ${diff}`;
  return "· ±0";
}

function buildLatestMd(week, source, counts, prev) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const prevTotal = prev
    ? Number(prev.total_count) || 0
    : null;
  const lines = [];
  lines.push(`# GSC Coverage Drilldown — ${week}`);
  lines.push("");
  lines.push(`**取得日**: ${new Date().toISOString().slice(0, 10)} / **ソース**: ${source}`);
  lines.push("");
  lines.push("## カテゴリ別件数（前週比）");
  lines.push("");
  lines.push("| カテゴリ | 今週 | 前週 | 変化 |");
  lines.push("|---|---:|---:|---|");
  for (const cat of CATEGORIES) {
    const cur = counts[cat.id] || 0;
    const pCol = `count_${cat.id.replace(/-/g, "_")}`;
    const prevVal = prev ? Number(prev[pCol]) || 0 : null;
    lines.push(
      `| ${cat.label} | ${cur} | ${prevVal === null ? "—" : prevVal} | ${deltaSymbol(cur, prevVal)} |`,
    );
  }
  lines.push(
    `| **合計** | **${total}** | ${prevTotal === null ? "—" : prevTotal} | ${deltaSymbol(total, prevTotal)} |`,
  );
  lines.push("");
  lines.push("## 注意");
  lines.push("");
  lines.push(
    "- 各カテゴリの件数は **GSC export の上限 1000 件サンプル**。実数（GSC UI 集計値）は `summary.json.full_count_estimate_total` に手入力で併記する",
  );
  lines.push(
    "- 「前回のクロール」が古い URL は Google が再クロールしていない兆候。Phase 6 の URL Inspection API（個別 URL 観測）と併読",
  );
  lines.push("");
  lines.push("## 詳細");
  lines.push("");
  lines.push(`- 今週の URL リスト: \`${week}/\` 配下 6 CSV`);
  lines.push(`- 時系列集約: \`history.csv\``);
  lines.push("- 取得手順: GSC UI → カバレッジ → エラーカテゴリ → ドリルダウン → エクスポート");
  lines.push("- 解析コマンド: `node .claude/scripts/gsc/parse-coverage-drilldown.cjs`");
  lines.push("");
  return lines.join("\n");
}

function appendHistory(week, source, counts) {
  const historyPath = path.join(OUT_BASE, "history.csv");
  const cols = [
    "week",
    "total_count",
    "count_404",
    "count_5xx",
    "count_redirect",
    "count_alt_canonical",
    "count_dup_no_canonical",
    "count_soft_404",
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
    "", // full_count_estimate_total（手入力）
    source,
    fetchedAt,
  ].join(",");

  let lines = [];
  if (fs.existsSync(historyPath)) {
    lines = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
    // 同 week があれば置換、なければ append
    const headerLine = lines[0];
    const rest = lines.slice(1).filter((l) => !l.startsWith(`${week},`));
    lines = [headerLine, ...rest, newRow];
  } else {
    lines = [cols.join(","), newRow];
  }
  fs.writeFileSync(historyPath, lines.join("\n") + "\n");
}

function processGcsError(week) {
  const counts = {};
  let mtimeMax = 0;
  let written = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const src = path.join(GCS_ERROR_DIR, `${cat.id}.csv`);
    if (!fs.existsSync(src)) {
      log(`SKIP: ${cat.id}.csv not found in gcsエラー/`);
      counts[cat.id] = 0;
      continue;
    }
    const stat = fs.statSync(src);
    if (stat.mtimeMs > mtimeMax) mtimeMax = stat.mtimeMs;
    const normalized = readCsvNormalized(src, cat.id);
    const lineCount = normalized.split("\n").length - 2; // ヘッダ + 末尾改行を除く
    counts[cat.id] = lineCount;
    const dst = path.join(OUT_BASE, week, `${cat.id}-urls.csv`);
    if (DRY_RUN) {
      log(`DRY: ${cat.id}-urls.csv (${lineCount} rows) → ${path.relative(PROJECT_ROOT, dst)}`);
      continue;
    }
    if (writeIfChanged(dst, normalized)) {
      written++;
      log(`WROTE: ${cat.id}-urls.csv (${lineCount} rows)`);
    } else {
      skipped++;
    }
  }

  if (!DRY_RUN) {
    const summaryPath = path.join(OUT_BASE, week, "summary.json");
    const summary = buildSummaryJson(week, "gcsエラー", counts, mtimeMax);
    if (writeIfChanged(summaryPath, summary)) written++;
  }

  return { counts, written, skipped, mtimeMax };
}

function main() {
  log(`Coverage Drilldown processor v1`);
  if (DRY_RUN) log("DRY-RUN mode (no files written)");

  const source = detectSource();
  log(`Source: ${source}`);

  // week 決定: 引数優先、なければ source の mtime から計算
  let week = WEEK_ARG;
  if (!week) {
    if (source === "gcsエラー") {
      const stat = fs.statSync(path.join(GCS_ERROR_DIR, "404.csv"));
      week = isoWeek(new Date(stat.mtimeMs));
    } else {
      week = isoWeek(new Date());
    }
  }
  log(`Week: ${week}`);

  let result;
  if (source === "gcsエラー") {
    result = processGcsError(week);
  } else {
    log("ERROR: downloads zip parsing not yet implemented (v2)");
    process.exit(1);
  }

  if (DRY_RUN) {
    log(`DRY-RUN done. Would write to ${path.join(OUT_BASE, week)}`);
    return;
  }

  // history.csv append
  appendHistory(week, source, result.counts);
  log(`history.csv updated`);

  // LATEST.md 更新
  const prev = loadPrevSummary(week);
  const latestMd = buildLatestMd(week, source, result.counts, prev);
  fs.writeFileSync(path.join(OUT_BASE, "LATEST.md"), latestMd);
  log(`LATEST.md updated`);

  log(
    `Done: ${result.written} files written, ${result.skipped} skipped (idempotent)`,
  );
  log(`Output: ${path.relative(PROJECT_ROOT, path.join(OUT_BASE, week))}`);
}

main();
