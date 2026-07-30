#!/usr/bin/env node
/**
 * docs/todo/04_改善バックログ.md のマークダウンテーブルを走査し、
 * status: pending|in-progress|effect/pending な active 施策を抽出する。
 *
 * weekly-plan の自動候補抽出と、triage-matrix.mjs の両方で利用する。
 *
 * Usage:
 *   node .claude/scripts/lib/scan-pending-improvements.mjs                    # 全 active 施策を JSON 出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown  # Markdown 表で出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --due-before 2026-05-24
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --tier 1,2
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --status pending
 *
 * Output JSON schema:
 *   [
 *     {
 *       metric: "gsc",
 *       file: "docs/todo/04_改善バックログ.md",
 *       section_id: "BLOG-CTR-02",
 *       title: "SEO タイトル改修 ...",
 *       status: "pending",
 *       tier: 1,
 *       target_metric: "gsc",
 *       due: "2026-06-13",
 *       owner: "claude",
 *       deep_link: "docs/todo/04_改善バックログ.md"
 *     }
 *   ]
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const BACKLOG_PATH = path.join(PROJECT_ROOT, "docs/todo/04_改善バックログ.md");
const BACKLOG_REL = "docs/todo/04_改善バックログ.md";

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const FORMAT = getArg("--format") || "json";
const DUE_BEFORE = getArg("--due-before");
const TIER_FILTER = getArg("--tier");
const STATUS_FILTER = getArg("--status") || "pending,in-progress,effect/pending";

const TARGET_STATUSES = new Set(STATUS_FILTER.split(",").map((s) => s.trim()));
const TARGET_TIERS = TIER_FILTER
  ? new Set(TIER_FILTER.split(",").map((s) => Number(s.trim())))
  : null;

/** 04_改善バックログ.md のマークダウンテーブルを行パースして施策一覧を返す */
function parseBacklog() {
  const content = readFileSync(BACKLOG_PATH, "utf-8");
  const entries = [];
  let currentTier = null;

  for (const line of content.split("\n")) {
    // ## Tier N からティアを取得
    const tierMatch = line.match(/^## Tier (\d)/);
    if (tierMatch) {
      currentTier = Number(tierMatch[1]);
      continue;
    }
    // ヘッダー行・区切り行をスキップ
    if (/^\|\s*ID\s*\|/.test(line) || /^\|[-| ]+\|$/.test(line)) continue;
    // データ行: | ID | タイトル | Status | Due | Owner | Metric |
    const cols = line.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cols.length < 6) continue;
    const [id, title, status, due, owner, metric] = cols;
    if (!id || id === "ID") continue;

    const dueClean = due === "-" ? null : (due.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || null;

    entries.push({
      metric: metric,
      file: BACKLOG_REL,
      section_id: id,
      title: title,
      status: status,
      tier: currentTier,
      target_metric: metric,
      due: dueClean,
      owner: owner,
      deep_link: BACKLOG_REL,
    });
  }
  return entries;
}

function applyFilters(entries) {
  return entries.filter((e) => {
    if (!TARGET_STATUSES.has(e.status)) return false;
    if (TARGET_TIERS && e.tier !== null && !TARGET_TIERS.has(e.tier)) return false;
    if (DUE_BEFORE && e.due && e.due > DUE_BEFORE) return false;
    return true;
  });
}

function sortByTier(entries) {
  return entries.slice().sort((a, b) => {
    const aT = a.tier ?? 99;
    const bT = b.tier ?? 99;
    if (aT !== bT) return aT - bT;
    const aDue = a.due || "9999-12-31";
    const bDue = b.due || "9999-12-31";
    return aDue.localeCompare(bDue);
  });
}

function formatMarkdown(entries) {
  if (entries.length === 0) return "_対象エントリなし_\n";
  const lines = [];
  lines.push("| Tier | Metric | ID | Title | Status | Due | Owner |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const e of entries) {
    const title = e.title.length > 40 ? e.title.slice(0, 40) + "…" : e.title;
    lines.push(
      `| ${e.tier ?? "-"} | ${e.metric} | ${e.section_id} | ${title} | ${e.status} | ${e.due ?? "-"} | ${e.owner ?? "-"} |`,
    );
  }
  return lines.join("\n") + "\n";
}

function main() {
  const allEntries = parseBacklog();
  const filtered = sortByTier(applyFilters(allEntries));
  if (FORMAT === "markdown") {
    process.stdout.write(formatMarkdown(filtered));
  } else {
    process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
  }
}

main();
