#!/usr/bin/env node
/**
 * docs/05_改善ログ/*.md を走査し、status: pending|in-progress な施策を抽出する。
 *
 * weekly-plan の自動候補抽出と、improvement-log-reminder-weekly.yml の triage Issue 起票の
 * 両方で利用する。
 *
 * Usage:
 *   node .claude/scripts/lib/scan-pending-improvements.mjs                    # 全 pending|in-progress を JSON 出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown  # Markdown 表で出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --due-before 2026-05-24
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --tier 1,2
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --status pending
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --overdue-days 14   # deployed_at から N 日経過のみ
 *
 * Output JSON schema:
 *   [
 *     {
 *       metric: "gsc",
 *       file: "docs/05_改善ログ/gsc.md",
 *       section_id: "BLOG-CTR-02",
 *       title: "SEO タイトル改修 ...",
 *       status: "pending",
 *       tier: 2,
 *       target_metric: "blog-ctr",
 *       deployed_at: "2026-05-17",
 *       due: "2026-06-13",
 *       owner: "claude",
 *       overdue_days: 1,
 *       deep_link: "docs/05_改善ログ/gsc.md#blog-ctr-02-..."
 *     }
 *   ]
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const LOG_DIR = path.join(PROJECT_ROOT, "docs", "05_改善ログ");

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const FORMAT = getArg("--format") || "json"; // json | markdown
const DUE_BEFORE = getArg("--due-before"); // YYYY-MM-DD
const TIER_FILTER = getArg("--tier"); // "1" or "1,2"
const STATUS_FILTER = getArg("--status") || "pending,in-progress";
const OVERDUE_DAYS = getArg("--overdue-days"); // number

const TARGET_STATUSES = new Set(STATUS_FILTER.split(",").map((s) => s.trim()));
const TARGET_TIERS = TIER_FILTER
  ? new Set(TIER_FILTER.split(",").map((s) => Number(s.trim())))
  : null;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ad = new Date(a + "T00:00:00Z").getTime();
  const bd = new Date(b + "T00:00:00Z").getTime();
  return Math.round((bd - ad) / 86400000);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\-ぁ-んァ-ヶ一-龯々ー]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 施策 ID パターン: [BLOG-CTR-02] / T0-DECAY-01 / EXP-005 / GA4-CLEAN-01 など
const ID_PATTERN_BRACKETED = /^##\s*\[([^\]]+)\]\s*(.*)/;
const ID_PATTERN_INLINE = /^##\s*((?:T[0-3]-[A-Z][A-Z0-9-]*-\d{2,}|EXP-\d{3,}[a-z]?|[A-Z][A-Z0-9]{2,}-[A-Z0-9-]+-\d{2,}))[:\s]+(.*)/;

// TEMPLATE 判定: ID が -XXX で終わる、title が "タイトル (期間)" を含む、ID が TEMPLATE を含む
function isTemplate(sectionId, title) {
  if (/TEMPLATE/i.test(sectionId)) return true;
  if (/-XXX$/.test(sectionId)) return true;
  if (/^タイトル\s*\(期間\)/.test(title)) return true;
  return false;
}

function parseSection(metric, file, headerLine, bodyLines) {
  let sectionId, title;
  const m1 = headerLine.match(ID_PATTERN_BRACKETED);
  const m2 = headerLine.match(ID_PATTERN_INLINE);
  if (m1) {
    sectionId = m1[1];
    title = m1[2].trim();
  } else if (m2) {
    sectionId = m2[1];
    title = m2[2].trim();
  } else {
    const rest = headerLine.replace(/^##\s*/, "").trim();
    sectionId = slugify(rest).slice(0, 60);
    title = rest;
  }

  if (isTemplate(sectionId, title)) return null;

  // body から `- **key**: value` を抽出 (frontmatter は H2 直下にあり、H3 配下の重複定義は無視)
  const meta = {};
  let passedFirstSubheader = false;
  for (const line of bodyLines) {
    if (line.startsWith("### ")) {
      passedFirstSubheader = true;
      continue;
    }
    if (passedFirstSubheader) continue; // H3 以降の `- **key**:` は対象外
    const m = line.match(/^-\s*\*\*([\w-]+)\*\*\s*:\s*(.+?)\s*$/);
    if (m) {
      const key = m[1].toLowerCase();
      if (!(key in meta)) meta[key] = m[2].trim(); // 最初の出現のみ採用
    }
  }

  // status: "pending (要 ...)" → "pending"
  const status = (meta.status || "").split(/[\s(]/)[0];
  const tier = meta.tier ? Number(meta.tier) : null;
  const targetMetric = meta.target_metric || null;
  // deployed_at: 括弧コメント (未着手) / (未公開...) は null 扱い
  const deployedRaw = meta.deployed_at || "";
  const deployedMatch = deployedRaw.match(/^(\d{4}-\d{2}-\d{2})/);
  const deployedAt = deployedMatch ? deployedMatch[1] : null;
  // due: 冒頭の YYYY-MM-DD だけ取り、補足 (W21 内) は別途
  const dueRaw = meta.due || "";
  const dueMatch = dueRaw.match(/^(\d{4}-\d{2}-\d{2})/);
  const due = dueMatch ? dueMatch[1] : null;
  // owner: pipe 区切り (claude | uruhayato373) はテンプレ残りなので null
  const ownerRaw = meta.owner || "";
  const owner = ownerRaw.includes("|") ? null : ownerRaw || null;

  const deepLink = `${file}#${slugify(headerLine.replace(/^##\s*/, ""))}`;
  const overdueDays = deployedAt ? daysBetween(deployedAt, todayISO()) : null;

  return {
    metric,
    file,
    section_id: sectionId,
    title,
    status,
    tier,
    target_metric: targetMetric,
    deployed_at: deployedAt,
    due,
    owner,
    overdue_days: overdueDays,
    deep_link: deepLink,
  };
}

function parseLogFile(filePath) {
  const metric = path.basename(filePath, ".md");
  const relFile = path.relative(PROJECT_ROOT, filePath);
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const sections = [];
  let currentHeader = null;
  let currentBody = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentHeader) {
        const parsed = parseSection(metric, relFile, currentHeader, currentBody);
        if (parsed) sections.push(parsed);
      }
      currentHeader = line;
      currentBody = [];
    } else if (currentHeader) {
      currentBody.push(line);
    }
  }
  if (currentHeader) {
    const parsed = parseSection(metric, relFile, currentHeader, currentBody);
    if (parsed) sections.push(parsed);
  }
  return sections;
}

function applyFilters(entries) {
  return entries.filter((e) => {
    if (!TARGET_STATUSES.has(e.status)) return false;
    if (TARGET_TIERS && e.tier !== null && !TARGET_TIERS.has(e.tier)) return false;
    if (DUE_BEFORE && e.due && e.due > DUE_BEFORE) return false;
    if (OVERDUE_DAYS && e.overdue_days !== null && e.overdue_days < Number(OVERDUE_DAYS)) {
      return false;
    }
    return true;
  });
}

function sortByTier(entries) {
  return entries.slice().sort((a, b) => {
    const aT = a.tier ?? 99;
    const bT = b.tier ?? 99;
    if (aT !== bT) return aT - bT;
    // Tier 同じなら due が早い順
    const aDue = a.due || "9999-12-31";
    const bDue = b.due || "9999-12-31";
    return aDue.localeCompare(bDue);
  });
}

function formatMarkdown(entries) {
  if (entries.length === 0) {
    return "_対象エントリなし_\n";
  }
  const lines = [];
  lines.push("| Tier | Metric | ID | Title | Status | Due | Owner |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const e of entries) {
    const title = e.title.length > 40 ? e.title.slice(0, 40) + "…" : e.title;
    lines.push(
      `| ${e.tier ?? "-"} | ${e.metric} | ${e.section_id} | ${title} | ${e.status} | ${e.due ?? "-"} | ${e.owner ?? "-"} |`,
    );
  }
  lines.push("");
  lines.push("### 詳細リンク");
  for (const e of entries) {
    lines.push(`- [${e.section_id}: ${e.title}](${e.deep_link})`);
  }
  return lines.join("\n") + "\n";
}

function main() {
  let files;
  try {
    files = readdirSync(LOG_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(LOG_DIR, f));
  } catch (err) {
    console.error(`Cannot read ${LOG_DIR}: ${err.message}`);
    process.exit(1);
  }

  const allEntries = files.flatMap(parseLogFile);
  const filtered = sortByTier(applyFilters(allEntries));

  if (FORMAT === "markdown") {
    process.stdout.write(formatMarkdown(filtered));
  } else {
    process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
  }
}

main();
