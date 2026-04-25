#!/usr/bin/env node
/**
 * GSC Coverage Drilldown 週次解析・継続記録 (v2)
 *
 * GSC UI で取得した Coverage Drilldown zip を Downloads から直接読み取り、
 * `.claude/state/metrics/gsc/coverage-drilldown/` に継続保存する。
 * 取り込み後は Downloads の zip を削除（中継ディレクトリ不要）。
 *
 * Phase 7（親 issue #115 / issue #43 配下）の中核スクリプト。
 *
 * 入力:
 *   ~/Downloads/stats47.jp-Coverage-Drilldown-YYYY-MM-DD*.zip （複数）
 *   - zip 内: メタデータ.csv（カテゴリ識別） + 表.csv（URL リスト）
 *   - ファイル名は CP932（日本語）→ Python の zipfile で読む
 *
 * 出力:
 *   .claude/state/metrics/gsc/coverage-drilldown/
 *   ├ LATEST.md                          人間が 10 秒で「今週の変化」を把握
 *   ├ history.csv                        週次集約（agent 解析用）
 *   └ YYYY-Www/
 *     ├ {category}-urls.csv (最大 6 file)  URL,前回のクロール の 2 列に統一
 *     └ summary.json                       week, source_zips, fetched_at, counts
 *
 * 取り込み後の処理:
 *   - --keep-zips 指定なし: Downloads の zip を削除（デフォルト）
 *   - --keep-zips: zip を保持（テスト時など）
 *
 * 使い方:
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs           # 自動: Downloads から取り込み + zip 削除
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs --keep-zips
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs --dry-run # 計画表示のみ、何も書かない・消さない
 *   node .claude/scripts/gsc/parse-coverage-drilldown.cjs --week 2026-W17  # 週手動指定
 *
 * 設計原則:
 *   - 中継ディレクトリ不要: gcsエラー/ などは作成しない
 *   - 冪等性: 同じ入力なら 2 回実行で skip
 *   - 取り込み即削除: Downloads の zip は CSV に変換後すぐ消す
 *   - スキーマ正規化: 全カテゴリ「URL,前回のクロール」の 2 列統一
 *   - 取得失敗時アラート: stderr + exit 1
 */

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT_BASE = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/gsc/coverage-drilldown",
);
const DOWNLOADS = path.join(os.homedir(), "Downloads");

// メタデータ.csv の「問題」値 → 内部カテゴリ ID
const PROBLEM_TO_CATEGORY = {
  "見つかりませんでした（404）": "404",
  "サーバーエラー（5xx）": "5xx",
  "ページにリダイレクトがあります": "redirect",
  "代替ページ（適切な canonical タグあり）": "alt-canonical",
  "クロール済み - インデックス未登録": "crawled-not-indexed",
  "重複しています。ユーザーにより、正規ページとして選択されていません": "dup-no-canonical",
  "ソフト 404": "soft-404",
  "ソフト404": "soft-404",
  "検出 - インデックス未登録": "discovered-not-indexed",
};

// 表示用ラベル
const CATEGORY_LABELS = {
  "404": "見つかりませんでした (404)",
  "5xx": "サーバーエラー (5xx)",
  "redirect": "ページにリダイレクトがあります",
  "alt-canonical": "代替ページ (canonical 適切)",
  "crawled-not-indexed": "クロール済み - インデックス未登録",
  "dup-no-canonical": "重複 (user canonical なし)",
  "soft-404": "ソフト 404",
  "discovered-not-indexed": "検出 - インデックス未登録",
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const KEEP_ZIPS = args.includes("--keep-zips");
const WEEK_ARG = (() => {
  const i = args.indexOf("--week");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
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

function detectZips() {
  if (!fs.existsSync(DOWNLOADS)) return [];
  return fs
    .readdirSync(DOWNLOADS)
    .filter((n) =>
      /^stats47\.jp-Coverage-Drilldown-\d{4}-\d{2}-\d{2}.*\.zip$/i.test(n),
    )
    .map((n) => path.join(DOWNLOADS, n));
}

function readZipEntries(zipPath) {
  // Python で zip を読む（CP932 → UTF-8）。返り値: { metadata: string, table: string }
  const py = `
import zipfile, json, sys
zp = sys.argv[1]
out = {}
with zipfile.ZipFile(zp) as z:
    for info in z.infolist():
        try:
            name = info.filename.encode('cp437').decode('cp932')
        except Exception:
            name = info.filename
        with z.open(info) as f:
            raw = f.read()
        for enc in ('utf-8-sig','utf-8','cp932'):
            try:
                txt = raw.decode(enc); break
            except UnicodeDecodeError:
                continue
        else:
            txt = raw.decode('utf-8', errors='replace')
        if 'メタデータ' in name:
            out['metadata'] = txt
        elif '表' in name:
            out['table'] = txt
print(json.dumps(out, ensure_ascii=False))
`;
  const result = spawnSync("python3", ["-c", py, zipPath], { encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`Python zip read failed: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

function categoryFromMetadata(metadataCsv) {
  // メタデータ.csv の「問題」行から値を取り出してカテゴリ ID に変換
  const lines = metadataCsv.replace(/^﻿/, "").split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const cols = line.split(",");
    if (cols[0] === "問題" && cols[1]) {
      const problem = cols[1].trim();
      const categoryId = PROBLEM_TO_CATEGORY[problem];
      if (categoryId) return { categoryId, problem };
      log(`UNKNOWN PROBLEM: "${problem}" → mapping を PROBLEM_TO_CATEGORY に追加してください`);
      return { categoryId: null, problem };
    }
  }
  return { categoryId: null, problem: null };
}

function normalizeTableCsv(tableCsv) {
  // 表.csv を URL,前回のクロール の 2 列に正規化
  const text = tableCsv.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) throw new Error("Empty table.csv");
  const header = lines[0].split(",");
  const urlIdx = header.findIndex((h) => h.trim() === "URL");
  const dateIdx = header.findIndex((h) => h.trim() === "前回のクロール");
  if (urlIdx < 0 || dateIdx < 0) {
    throw new Error(`Unexpected table.csv header: ${header.join(",")}`);
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
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, "utf-8") === content) return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function loadPrevSummary(week) {
  const historyPath = path.join(OUT_BASE, "history.csv");
  if (!fs.existsSync(historyPath)) return null;
  const lines = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
  if (lines.length < 2) return null;
  const header = lines[0].split(",");
  const rows = lines.slice(1).map((l) => {
    const cols = l.split(",");
    const obj = {};
    header.forEach((h, i) => (obj[h] = cols[i]));
    return obj;
  });
  return rows.filter((r) => r.week !== week).pop() || null;
}

function deltaSymbol(cur, prev) {
  if (prev === undefined || prev === null) return "—";
  const diff = cur - prev;
  if (diff > 0) return `▲ +${diff}`;
  if (diff < 0) return `▼ ${diff}`;
  return "· ±0";
}

function buildLatestMd(week, sourceZips, counts, prev) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const prevTotal = prev ? Number(prev.total_count) || 0 : null;
  const lines = [];
  lines.push(`# GSC Coverage Drilldown — ${week}`);
  lines.push("");
  lines.push(`**取得日**: ${new Date().toISOString().slice(0, 10)}`);
  if (sourceZips.length > 0) {
    lines.push(`**ソース zip**: ${sourceZips.length} 件`);
    for (const z of sourceZips) lines.push(`  - ${path.basename(z)}`);
  } else {
    lines.push(`**ソース**: なし（カウントのみ更新）`);
  }
  lines.push("");
  lines.push("## カテゴリ別件数（前週比）");
  lines.push("");
  lines.push("| カテゴリ | 今週 | 前週 | 変化 |");
  lines.push("|---|---:|---:|---|");
  // 出力順は CATEGORY_LABELS のキー順
  for (const id of Object.keys(CATEGORY_LABELS)) {
    if (counts[id] === undefined) continue;
    const cur = counts[id];
    const pCol = `count_${id.replace(/-/g, "_")}`;
    const prevVal = prev ? Number(prev[pCol]) || 0 : null;
    lines.push(
      `| ${CATEGORY_LABELS[id]} | ${cur} | ${prevVal === null ? "—" : prevVal} | ${deltaSymbol(cur, prevVal)} |`,
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
  lines.push(`- 今週の URL リスト: \`${week}/\` 配下`);
  lines.push(`- 時系列集約: \`history.csv\``);
  lines.push("- 取得手順: GSC UI → カバレッジ → エラーカテゴリ → ドリルダウン → エクスポート → Downloads に保存");
  lines.push("- 解析コマンド: `node .claude/scripts/gsc/parse-coverage-drilldown.cjs`");
  lines.push("- 取り込み後: Downloads の zip は自動削除（--keep-zips で保持可能）");
  lines.push("");
  return lines.join("\n");
}

function appendHistory(week, sourceLabel, counts) {
  const historyPath = path.join(OUT_BASE, "history.csv");
  // history.csv の column は固定（v1 と互換性維持）
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
    "full_count_estimate_total",
    "source",
    "fetched_at",
  ];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const fetchedAt = new Date().toISOString();
  const newRow = [
    week,
    total,
    counts["404"] || 0,
    counts["5xx"] || 0,
    counts.redirect || 0,
    counts["alt-canonical"] || 0,
    counts["dup-no-canonical"] || 0,
    counts["soft-404"] || 0,
    counts["crawled-not-indexed"] || 0,
    counts["discovered-not-indexed"] || 0,
    "",
    sourceLabel,
    fetchedAt,
  ].join(",");

  let lines = [];
  if (fs.existsSync(historyPath)) {
    const existing = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
    const headerLine = cols.join(","); // 列追加に対応するため常に新ヘッダで上書き
    const rest = existing
      .slice(1)
      .filter((l) => l && !l.startsWith(`${week},`))
      .map((l) => {
        // 旧 column 数の行を新 column 数にパディング（NULL 列追加）
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
}

function main() {
  log(`Coverage Drilldown processor v2 (Downloads zip 直接対応)`);
  if (DRY_RUN) log("DRY-RUN mode (no files written/deleted)");

  const zips = detectZips();
  if (zips.length === 0) {
    log("ERROR: Downloads に Coverage Drilldown zip が見つかりません");
    log("[手順]");
    log("  1. Google Search Console → カバレッジ → エラーカテゴリ → ドリルダウン → エクスポート");
    log("  2. 全カテゴリ (404, 5xx, redirect, alt-canonical, dup-no-canonical, soft-404, ...) を Downloads に保存");
    log("  3. 本コマンドを再実行");
    process.exit(1);
  }
  log(`Found ${zips.length} zip(s) in Downloads`);

  // 各 zip を解析: メタデータ.csv → カテゴリ判定、表.csv → 正規化
  const parsed = [];
  for (const zp of zips) {
    log(`  parsing ${path.basename(zp)}`);
    const entries = readZipEntries(zp);
    if (!entries.metadata || !entries.table) {
      log(`  SKIP: メタデータ.csv または 表.csv が見つかりません`);
      continue;
    }
    const { categoryId, problem } = categoryFromMetadata(entries.metadata);
    if (!categoryId) {
      log(`  SKIP: カテゴリ判定不能 (問題="${problem}")`);
      continue;
    }
    const normalized = normalizeTableCsv(entries.table);
    const rowCount = normalized.split("\n").length - 2;
    parsed.push({ zipPath: zp, categoryId, problem, normalized, rowCount });
    log(`  → ${categoryId} (${rowCount} rows)`);
  }

  if (parsed.length === 0) {
    log("ERROR: 解析可能な zip が 1 件もありませんでした");
    process.exit(1);
  }

  // week 決定: 引数優先、なければ zip ファイル名から日付抽出して ISO Week 計算
  let week = WEEK_ARG;
  if (!week) {
    const dateMatch = path.basename(parsed[0].zipPath).match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      week = isoWeek(new Date(dateMatch[1]));
    } else {
      week = isoWeek(new Date());
    }
  }
  log(`Week: ${week}`);

  // 同一カテゴリの zip が複数あれば最新（mtime 最大）を採用
  const byCategory = {};
  for (const p of parsed) {
    const stat = fs.statSync(p.zipPath);
    const existing = byCategory[p.categoryId];
    if (!existing || stat.mtimeMs > fs.statSync(existing.zipPath).mtimeMs) {
      byCategory[p.categoryId] = p;
    }
  }

  // 出力
  const counts = {};
  let written = 0;
  let skipped = 0;
  for (const id of Object.keys(byCategory)) {
    const item = byCategory[id];
    counts[id] = item.rowCount;
    const dst = path.join(OUT_BASE, week, `${id}-urls.csv`);
    if (DRY_RUN) {
      log(`  DRY: would write ${path.relative(PROJECT_ROOT, dst)} (${item.rowCount} rows)`);
      continue;
    }
    if (writeIfChanged(dst, item.normalized)) {
      written++;
      log(`  WROTE: ${id}-urls.csv (${item.rowCount} rows)`);
    } else {
      skipped++;
      log(`  SKIP: ${id}-urls.csv (no change)`);
    }
  }

  if (!DRY_RUN) {
    // summary.json
    const summary = JSON.stringify(
      {
        week,
        source_zips: zips.map((z) => path.basename(z)),
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
    writeIfChanged(path.join(OUT_BASE, week, "summary.json"), summary);

    // history.csv + LATEST.md
    appendHistory(week, "downloads", counts);
    log("history.csv updated");
    const prev = loadPrevSummary(week);
    fs.writeFileSync(
      path.join(OUT_BASE, "LATEST.md"),
      buildLatestMd(week, zips, counts, prev),
    );
    log("LATEST.md updated");
  }

  // 取り込み後: Downloads zip 削除（KEEP_ZIPS 指定なし & DRY_RUN なし）
  if (!DRY_RUN && !KEEP_ZIPS) {
    for (const zp of zips) {
      try {
        fs.unlinkSync(zp);
        log(`  DELETED: ${path.basename(zp)}`);
      } catch (e) {
        log(`  delete failed: ${path.basename(zp)} (${e.message})`);
      }
    }
  } else if (KEEP_ZIPS) {
    log(`KEEP_ZIPS: Downloads の zip は保持（${zips.length} 件）`);
  }

  log(
    `Done: ${written} files written, ${skipped} skipped (idempotent), ${parsed.length} zip(s) processed`,
  );
}

main();
