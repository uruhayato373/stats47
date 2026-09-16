#!/usr/bin/env node
// build-role-review-queue.mjs — 夜間 selection backfill の「role の推奨」を横断集約し、
// 採否・反映状況を進捗管理できる queue にする。
//
// なぜ要るか: run-selection-backfill.sh の report (reference/audits/<日付>-selection-backfill.md)
// は夜ごとに増えるが、どれが人間にレビューされ・採用され・実際に ThemeCatalog へ反映されたかを
// 追う場所が無かった。「反映済み」は手書きフラグにせず、実際の THEME_CATALOGS の role と
// 突合して自動判定する (手動フラグは必ずドリフトする — feedback_hand_synced_duplication)。
//
// 使い方:
//   node --import tsx .claude/scripts/themes/build-role-review-queue.mjs           # queue 再構築
//   node --import tsx .claude/scripts/themes/build-role-review-queue.mjs decide \
//     --theme healthcare --key life-expectancy-0-male --decision accept --note "..."
//
// 出力:
//   .claude/state/theme/role-review-queue.json  — 機械可読 (status: pending/accepted/rejected/applied)
//   .claude/state/theme/LATEST.md               — 人間向けサマリ (件数 + pending 一覧)
//
// status の決め方 (優先順):
//   1. THEME_CATALOGS の現在の role === recommended → applied (実測。手動フラグより優先)
//   2. decisions.json に reject 記録がある → rejected
//   3. decisions.json に accept 記録がある (まだ未反映) → accepted
//   4. それ以外 → pending
//
// 正典: .claude/rules/theme-catalog-standards.md §4 / 実行契約:
//   .claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md
// 進捗の正典 backlog: .claude/todo/backlog.md THEME-ROLE-REVIEW-01

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { THEME_CATALOGS } from "../../../packages/data-configs/src/theme-catalog/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const AUDITS_DIR = path.join(
  ROOT,
  ".claude/skills/theme/manage-theme-portfolio/reference/audits",
);
const STATE_DIR = path.join(ROOT, ".claude/state/theme");
const QUEUE_FILE = path.join(STATE_DIR, "role-review-queue.json");
const LATEST_FILE = path.join(STATE_DIR, "LATEST.md");
const DECISIONS_FILE = path.join(STATE_DIR, "role-review-decisions.json");

function log(msg) {
  process.stdout.write(`[build-role-review-queue] ${msg}\n`);
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// 「## role の推奨」節から theme|rankingKey|現在|推奨|理由 の表を抜く。
// ヘッダ行・区切り行 (全セル --- ) は捨てる。
function parseRoleTable(markdown, sourceReport) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## role の推奨"));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  const section = end === -1 ? rest : rest.slice(0, end);
  const rows = [];
  for (const line of section) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 5) continue;
    const [theme, rankingKey, current, recommended] = cells;
    if (theme === "theme" || theme === "---" || /^-+$/.test(theme)) continue;
    rows.push({
      theme,
      rankingKey,
      recordedCurrent: current,
      recommended,
      reason: cells.slice(4).join(" | "),
      sourceReport,
    });
  }
  return rows;
}

function liveRole(theme, rankingKey) {
  const catalog = THEME_CATALOGS[theme];
  if (!catalog) return undefined;
  return catalog.metrics.find((m) => m.rankingKey === rankingKey)?.role;
}

function buildQueue() {
  if (!fs.existsSync(AUDITS_DIR)) {
    log(`WARN: audits dir が無い (${AUDITS_DIR})`);
    return [];
  }
  const files = fs
    .readdirSync(AUDITS_DIR)
    .filter((f) => f.endsWith("-selection-backfill.md"))
    .sort(); // 日付昇順 → 後勝ちで最新の推奨を採用

  const byKey = new Map();
  for (const file of files) {
    const dateMatch = /^(\d{4}-\d{2}-\d{2})-/.exec(file);
    const sourceDate = dateMatch ? dateMatch[1] : null;
    const markdown = fs.readFileSync(path.join(AUDITS_DIR, file), "utf8");
    for (const row of parseRoleTable(markdown, file)) {
      const key = `${row.theme}::${row.rankingKey}`;
      const prior = byKey.get(key);
      byKey.set(key, {
        ...row,
        sourceDate,
        firstSeenAt: prior?.firstSeenAt ?? sourceDate,
      });
    }
  }

  const decisions = loadJson(DECISIONS_FILE, { entries: [] });
  const decisionByKey = new Map(
    decisions.entries.map((d) => [`${d.theme}::${d.rankingKey}`, d]),
  );

  const queue = [];
  for (const [key, row] of byKey) {
    const current = liveRole(row.theme, row.rankingKey);
    const decision = decisionByKey.get(key);
    let status = "pending";
    let note = null;
    if (current === undefined) {
      status = "orphan"; // 指標が現在の catalog に無い (削除/rename)
      note = "現在の THEME_CATALOGS に rankingKey が見つからない";
    } else if (current === row.recommended && current !== row.recordedCurrent) {
      status = "applied";
    } else if (decision?.decision === "reject") {
      status = "rejected";
      note = decision.note ?? null;
    } else if (decision?.decision === "accept") {
      status = "accepted";
      note = decision.note ?? null;
    }
    queue.push({
      theme: row.theme,
      rankingKey: row.rankingKey,
      recordedCurrent: row.recordedCurrent,
      recommended: row.recommended,
      currentRole: current ?? null,
      reason: row.reason,
      status,
      note,
      firstSeenAt: row.firstSeenAt,
      sourceReport: row.sourceReport,
      decidedAt: decision?.decidedAt ?? null,
      decidedBy: decision?.decidedBy ?? null,
    });
  }
  queue.sort((a, b) =>
    a.theme === b.theme
      ? a.rankingKey.localeCompare(b.rankingKey)
      : a.theme.localeCompare(b.theme),
  );
  return queue;
}

function writeLatestMd(queue) {
  const counts = { pending: 0, accepted: 0, rejected: 0, applied: 0, orphan: 0 };
  for (const e of queue) counts[e.status] = (counts[e.status] ?? 0) + 1;

  const lines = [];
  lines.push("# role 変更提案の進捗 (自動生成 — 手編集しない)");
  lines.push("");
  lines.push(`生成: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    `| pending | accepted (未反映) | applied | rejected | orphan | 合計 |`,
  );
  lines.push(`|---|---|---|---|---|---|`);
  lines.push(
    `| ${counts.pending} | ${counts.accepted} | ${counts.applied} | ${counts.rejected} | ${counts.orphan} | ${queue.length} |`,
  );
  lines.push("");
  lines.push(
    "反映 (`applied`) は手動フラグではなく、`THEME_CATALOGS` の実際の role と recommended の一致で自動判定する。",
  );
  lines.push("");

  const pending = queue.filter((e) => e.status === "pending" || e.status === "accepted");
  if (pending.length > 0) {
    lines.push("## 未反映 (pending + accepted)");
    lines.push("");
    lines.push("| theme | rankingKey | 現在 | 推奨 | status | 理由 |");
    lines.push("|---|---|---|---|---|---|");
    for (const e of pending) {
      lines.push(
        `| ${e.theme} | ${e.rankingKey} | ${e.currentRole ?? e.recordedCurrent} | ${e.recommended} | ${e.status} | ${e.reason} |`,
      );
    }
    lines.push("");
  }

  const orphan = queue.filter((e) => e.status === "orphan");
  if (orphan.length > 0) {
    lines.push("## orphan (現在の catalog に rankingKey が無い — 要確認)");
    lines.push("");
    lines.push("| theme | rankingKey | 推奨 |");
    lines.push("|---|---|---|");
    for (const e of orphan) {
      lines.push(`| ${e.theme} | ${e.rankingKey} | ${e.recommended} |`);
    }
    lines.push("");
  }

  lines.push(
    "反映手順・採択ゲートは `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md`、backlog は `THEME-ROLE-REVIEW-01`。",
  );
  fs.writeFileSync(LATEST_FILE, `${lines.join("\n")}\n`);
}

function cmdBuild() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const queue = buildQueue();
  fs.writeFileSync(
    QUEUE_FILE,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: queue }, null, 2)}\n`,
  );
  writeLatestMd(queue);
  const counts = {};
  for (const e of queue) counts[e.status] = (counts[e.status] ?? 0) + 1;
  log(
    `queue ${queue.length} 件 (${Object.entries(counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(" / ")})`,
  );
}

function cmdDecide(args) {
  const theme = args["--theme"];
  const rankingKey = args["--key"];
  const decision = args["--decision"];
  const note = args["--note"] ?? null;
  if (!theme || !rankingKey || !["accept", "reject"].includes(decision)) {
    throw new Error(
      "使い方: decide --theme <theme> --key <rankingKey> --decision accept|reject [--note '...']",
    );
  }
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const decisions = loadJson(DECISIONS_FILE, { entries: [] });
  const key = `${theme}::${rankingKey}`;
  decisions.entries = decisions.entries.filter(
    (d) => `${d.theme}::${d.rankingKey}` !== key,
  );
  decisions.entries.push({
    theme,
    rankingKey,
    decision,
    note,
    decidedAt: new Date().toISOString().slice(0, 10),
    decidedBy: process.env.USER ?? "unknown",
  });
  fs.writeFileSync(DECISIONS_FILE, `${JSON.stringify(decisions, null, 2)}\n`);
  log(`decision recorded: ${key} → ${decision}`);
  cmdBuild();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) out[argv[i]] = argv[i + 1];
  return out;
}

const [sub, ...rest] = process.argv.slice(2);
if (sub === "decide") {
  cmdDecide(parseArgs(rest));
} else {
  cmdBuild();
}
