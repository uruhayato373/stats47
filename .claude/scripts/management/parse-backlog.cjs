#!/usr/bin/env node
/**
 * docs/50_Issues/indicator-backlog.md の Markdown 表を JSON 配列にパースする。
 *
 * 用途:
 *   `/expand-indicators` から呼び出され、status='pending' AND priority IN (filter) を満たす
 *   候補を priority 順 (high > medium > low) に並べた配列を stdout に出力する。
 *
 * Usage:
 *   node .claude/scripts/management/parse-backlog.cjs \
 *     --backlog docs/50_Issues/indicator-backlog.md \
 *     --priority high \
 *     --status pending \
 *     --limit 10
 *
 * Output (stdout, JSON):
 *   [
 *     {
 *       "priority": "high",
 *       "candidate_slug": "convenience-store-sales-monthly",
 *       "category": "commercial",
 *       "suggested_theme": "local-economy",
 *       "estat_stats_data_id": "0004032502",
 *       "rationale": "コンビニ販売額 todo-ran 強い",
 *       "status": "pending",
 *       "line_number": 62
 *     },
 *     ...
 *   ]
 *
 * 列順: priority | candidate_slug | category | suggested_theme | estat_stats_data_id | rationale | status
 * (列順が変わったらヘッダー検出ロジックを更新)
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
}

const backlogPath = path.resolve(
  PROJECT_ROOT,
  getArg("--backlog", "docs/50_Issues/indicator-backlog.md"),
);
const priorityFilter = getArg("--priority", "all"); // high|medium|low|all
const statusFilter = getArg("--status", "pending"); // pending|done|failed|all
const limit = Number.parseInt(getArg("--limit", "10"), 10);

if (!fs.existsSync(backlogPath)) {
  console.error(`[parse-backlog] backlog file not found: ${backlogPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(backlogPath, "utf-8");
const lines = raw.split("\n");

const EXPECTED_HEADER = [
  "priority",
  "candidate_slug",
  "category",
  "suggested_theme",
  "estat_stats_data_id",
  "rationale",
  "status",
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const candidates = [];
let inTable = false;
let headerSeen = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) {
    if (inTable) break; // table ended (allow only one table block)
    continue;
  }
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

  // ヘッダー行を検出
  if (!headerSeen) {
    if (cells.length >= 7 && cells.slice(0, 7).join("|") === EXPECTED_HEADER.join("|")) {
      headerSeen = true;
      inTable = true;
      continue;
    }
    continue;
  }

  // separator (|---|---|...) skip
  if (cells.every((c) => /^:?-+:?$/.test(c))) continue;

  // 通常データ行
  if (cells.length < 7) continue;
  const [
    priority,
    candidate_slug,
    category,
    suggested_theme,
    estat_stats_data_id,
    rationale,
    status,
  ] = cells;

  candidates.push({
    priority,
    candidate_slug,
    category,
    suggested_theme,
    estat_stats_data_id,
    rationale,
    status,
    line_number: i + 1,
  });
}

// フィルタリング
let filtered = candidates;
if (priorityFilter !== "all") {
  const allow = new Set(priorityFilter.split(",").map((s) => s.trim()));
  filtered = filtered.filter((c) => allow.has(c.priority));
}
if (statusFilter !== "all") {
  const allow = new Set(statusFilter.split(",").map((s) => s.trim()));
  filtered = filtered.filter((c) => allow.has(c.status));
}

// priority 昇順 (high → low) + 元順序保持
filtered.sort((a, b) => {
  const ra = PRIORITY_RANK[a.priority] ?? 99;
  const rb = PRIORITY_RANK[b.priority] ?? 99;
  if (ra !== rb) return ra - rb;
  return a.line_number - b.line_number;
});

const sliced = Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered;

process.stdout.write(JSON.stringify(sliced, null, 2) + "\n");
