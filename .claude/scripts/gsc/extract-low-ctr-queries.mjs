#!/usr/bin/env node
/**
 * extract-low-ctr-queries.mjs
 *
 * GSC snapshot queries.csv から「position 5-15 帯 × CTR < 業界平均」のクエリを抽出。
 * Phase 3 CTR 自動改善の月次抽出スクリプト。
 *
 * Usage:
 *   node .claude/scripts/gsc/extract-low-ctr-queries.mjs [--input <path>] [--format markdown|json] [--max N]
 *
 * Defaults:
 *   --input  最新 snapshot (.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/queries.csv)
 *   --format markdown
 *   --max    10
 *
 * snapshot がない場合は "skip: no snapshot found" を stdout に出して exit 0 (CI で skip 判定)。
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ---- CLI ----
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const FORMAT = getArg("--format") || "markdown";
const MAX = Number(getArg("--max") || 10);
const INPUT = getArg("--input");

if (!["markdown", "json"].includes(FORMAT)) {
  console.error(`Invalid --format: ${FORMAT} (expected markdown|json)`);
  process.exit(1);
}

// ---- 業界平均 CTR (Backlinko 2023、position → %) ----
const INDUSTRY_AVG = {
  1: 27.6, 2: 15.8, 3: 11.0, 4: 8.4, 5: 6.3,
  6: 4.9, 7: 3.9, 8: 3.3, 9: 2.7, 10: 2.4,
  11: 2.2, 12: 1.9, 13: 1.6, 14: 1.4, 15: 1.2,
};

const SNAPSHOTS_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);

// ---- snapshot 解決 ----
function resolveInput() {
  if (INPUT) {
    if (!existsSync(INPUT)) {
      console.log(`skip: no snapshot found (input ${INPUT} does not exist)`);
      process.exit(0);
    }
    return INPUT;
  }
  if (!existsSync(SNAPSHOTS_DIR)) {
    console.log("skip: no snapshot found (snapshots directory missing)");
    process.exit(0);
  }
  const weeks = readdirSync(SNAPSHOTS_DIR)
    .filter((name) => /^\d{4}-W\d{2}$/.test(name))
    .filter((name) => statSync(path.join(SNAPSHOTS_DIR, name)).isDirectory())
    .sort();
  if (weeks.length === 0) {
    console.log("skip: no snapshot found (no week directories)");
    process.exit(0);
  }
  const latest = weeks[weeks.length - 1];
  const csv = path.join(SNAPSHOTS_DIR, latest, "queries.csv");
  if (!existsSync(csv)) {
    console.log(`skip: no snapshot found (queries.csv missing in ${latest})`);
    process.exit(0);
  }
  return csv;
}

// ---- CSV パーサ (シンプル、quoted カンマ対応) ----
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// ---- メイン ----
function main() {
  const inputPath = resolveInput();
  const weekLabel = path.basename(path.dirname(inputPath));
  const text = readFileSync(inputPath, "utf8");
  const { rows } = parseCsv(text);

  const candidates = [];
  for (const row of rows) {
    const query = row.query;
    const position = Number(row.position);
    const impressions = Number(row.impressions);
    const clicks = Number(row.clicks);
    const ctrRaw = Number(row.ctr);
    if (!query || !Number.isFinite(position) || !Number.isFinite(impressions)) continue;

    // ctr: snapshot は decimal (0-1) → % へ
    const ctrPct = ctrRaw <= 1 ? ctrRaw * 100 : ctrRaw;

    const pos = Math.round(position);
    if (pos < 5 || pos > 15) continue;
    if (impressions < 50) continue;
    const avg = INDUSTRY_AVG[pos];
    if (avg === undefined) continue;
    if (ctrPct >= avg) continue;

    const expectedAdditionalClicks = ((avg - ctrPct) * impressions) / 100;
    candidates.push({
      query,
      position: pos,
      positionRaw: position,
      impressions,
      clicks,
      ctrPct,
      industryAvgPct: avg,
      expectedAdditionalClicks,
    });
  }

  candidates.sort((a, b) => b.expectedAdditionalClicks - a.expectedAdditionalClicks);
  const top = candidates.slice(0, MAX);

  if (FORMAT === "json") {
    console.log(
      JSON.stringify(
        { week: weekLabel, source: path.relative(PROJECT_ROOT, inputPath), total: candidates.length, items: top },
        null,
        2,
      ),
    );
    return;
  }

  // markdown
  const lines = [];
  lines.push(`## CTR 改善候補 (期間: ${weekLabel}, 抽出: ${top.length} 件 / 候補 ${candidates.length} 件)`);
  lines.push("");
  lines.push(`source: \`${path.relative(PROJECT_ROOT, inputPath)}\``);
  lines.push("");
  if (top.length === 0) {
    lines.push("該当クエリなし (position 5-15 帯で業界平均を下回り、impressions >= 50 のクエリが存在しない)。");
  } else {
    lines.push("| Query | Position | Impr | CTR (%) | Industry Avg (%) | 期待 +Clicks/month |");
    lines.push("|---|---|---|---|---|---|");
    for (const c of top) {
      lines.push(
        `| ${c.query} | ${c.position} | ${c.impressions} | ${c.ctrPct.toFixed(2)} | ${c.industryAvgPct.toFixed(1)} | +${c.expectedAdditionalClicks.toFixed(1)} |`,
      );
    }
    lines.push("");
    lines.push("### 改善提案");
    lines.push("- 上位 3 クエリは `/brushup-blog-article <slug>` で seoTitle/description 改訂を検討");
    lines.push("- position 5-10 帯は CTR 倍増効果が大きい (industry avg 比 3-7x の改善余地)");
    lines.push("- 業界平均値の出典: Backlinko 2023 (https://backlinko.com/google-ctr-stats)");
  }
  console.log(lines.join("\n"));
}

main();
