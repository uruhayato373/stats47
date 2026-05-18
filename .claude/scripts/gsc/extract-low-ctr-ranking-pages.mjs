#!/usr/bin/env node
/**
 * extract-low-ctr-ranking-pages.mjs
 *
 * GSC snapshot pages.csv から「/ranking/<key> パス × position 5-15 帯 × CTR < 業界平均 × 0.8」の
 * ranking_key を抽出。/enhance-ranking-ai-content の入力候補リスト生成に使う。
 *
 * Usage:
 *   node .claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs [--input <path>] [--format markdown|json] [--max N] [--filter-key <key>]
 *
 * Defaults:
 *   --input       最新 snapshot (.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/pages.csv)
 *   --format      markdown
 *   --max         10
 *   --filter-key  なし (指定時はその ranking_key のみ抽出、効果検証用)
 *
 * snapshot がない場合は "skip: no snapshot found" を stdout に出して exit 0。
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const FORMAT = getArg("--format") || "markdown";
const MAX = Number(getArg("--max") || 10);
const INPUT = getArg("--input");
const FILTER_KEY = getArg("--filter-key");

if (!["markdown", "json"].includes(FORMAT)) {
  console.error(`Invalid --format: ${FORMAT} (expected markdown|json)`);
  process.exit(1);
}

// 業界平均 CTR (Backlinko 2023、position → %)
const INDUSTRY_AVG = {
  1: 27.6, 2: 15.8, 3: 11.0, 4: 8.4, 5: 6.3,
  6: 4.9, 7: 3.9, 8: 3.3, 9: 2.7, 10: 2.4,
  11: 2.2, 12: 1.9, 13: 1.6, 14: 1.4, 15: 1.2,
};

const CTR_THRESHOLD_RATIO = 0.8;

const SNAPSHOTS_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);

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
  const csv = path.join(SNAPSHOTS_DIR, latest, "pages.csv");
  if (!existsSync(csv)) {
    console.log(`skip: no snapshot found (pages.csv missing in ${latest})`);
    process.exit(0);
  }
  return csv;
}

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

function extractRankingKey(pageUrl) {
  const m = pageUrl.match(/\/ranking\/([^/?#]+)/);
  return m ? m[1] : null;
}

function main() {
  const inputPath = resolveInput();
  const weekLabel = path.basename(path.dirname(inputPath));
  const text = readFileSync(inputPath, "utf8");
  const { rows } = parseCsv(text);

  const candidates = [];
  for (const row of rows) {
    const page = row.page;
    if (!page || !page.includes("/ranking/")) continue;
    const rankingKey = extractRankingKey(page);
    if (!rankingKey) continue;
    if (FILTER_KEY && rankingKey !== FILTER_KEY) continue;

    const position = Number(row.position);
    const impressions = Number(row.impressions);
    const clicks = Number(row.clicks);
    const ctrRaw = Number(row.ctr);
    if (!Number.isFinite(position) || !Number.isFinite(impressions)) continue;

    const ctrPct = ctrRaw <= 1 ? ctrRaw * 100 : ctrRaw;
    const pos = Math.round(position);

    // --filter-key 指定時は閾値フィルタを通さず、現状値をそのまま出す (検証用)
    if (!FILTER_KEY) {
      if (pos < 5 || pos > 15) continue;
      if (impressions < 50) continue;
      const avg = INDUSTRY_AVG[pos];
      if (avg === undefined) continue;
      if (ctrPct >= avg * CTR_THRESHOLD_RATIO) continue;
    }

    const avg = INDUSTRY_AVG[pos] ?? null;
    const expectedAdditionalClicks =
      avg !== null ? ((avg - ctrPct) * impressions) / 100 : 0;
    candidates.push({
      rankingKey,
      page,
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
        {
          week: weekLabel,
          source: path.relative(PROJECT_ROOT, inputPath),
          filterKey: FILTER_KEY,
          total: candidates.length,
          items: top,
        },
        null,
        2,
      ),
    );
    return;
  }

  const lines = [];
  lines.push(
    `## ranking_key CTR 改善候補 (期間: ${weekLabel}, 抽出: ${top.length} 件 / 候補 ${candidates.length} 件)`,
  );
  lines.push("");
  lines.push(`source: \`${path.relative(PROJECT_ROOT, inputPath)}\``);
  if (FILTER_KEY) lines.push(`filter: \`--filter-key ${FILTER_KEY}\``);
  lines.push("");
  if (top.length === 0) {
    lines.push(
      "該当 ranking_key なし (position 5-15 帯 × CTR < 業界平均 × 0.8 × impressions >= 50 を満たすページが存在しない)。",
    );
  } else {
    lines.push(
      "| Ranking Key | Position | Impr | CTR (%) | Industry Avg (%) | 期待 +Clicks/month |",
    );
    lines.push("|---|---|---|---|---|---|");
    for (const c of top) {
      lines.push(
        `| \`${c.rankingKey}\` | ${c.position} | ${c.impressions} | ${c.ctrPct.toFixed(2)} | ${c.industryAvgPct?.toFixed(1) ?? "-"} | +${c.expectedAdditionalClicks.toFixed(1)} |`,
      );
    }
    lines.push("");
    lines.push("### 改善提案");
    lines.push(
      "- 上位 1-3 件は `/enhance-ranking-ai-content <ranking_key>` で NotebookLM ベースのリライト検討",
    );
    lines.push(
      "- 4 週後に `--filter-key <key>` で同コマンド再実行し業界平均到達を確認 (effect/full 判定)",
    );
    lines.push(
      "- 業界平均値の出典: Backlinko 2023 (https://backlinko.com/google-ctr-stats)",
    );
  }
  console.log(lines.join("\n"));
}

main();
