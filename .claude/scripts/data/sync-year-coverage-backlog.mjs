#!/usr/bin/env node
/**
 * sync-year-coverage-backlog.mjs — 年カバレッジ監査の要拡張候補をバックログカードにする。
 *
 * 週次の estat-year-coverage-audit-weekly が監査の後に呼ぶ。開いている YEAR-COV カードがあれば起票しない。
 * 起票したカードは backlog-loop-daily が処理し、`assert-year-coverage-batch.ts <batch>` を completion gate にして消す。
 *
 * Usage:
 *   node .claude/scripts/data/sync-year-coverage-backlog.mjs            # 起票 + 完了した batch の掃除
 *   node .claude/scripts/data/sync-year-coverage-backlog.mjs --dry-run  # 起票するカードを表示するだけ
 *   node .claude/scripts/data/sync-year-coverage-backlog.mjs --mark-by-design <key> --note "<理由>"
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { insertCards } from "../gsc/lib/coverage-backlog.mjs";
import { BATCH_DIR, BY_DESIGN_PATH, CARD_PREFIX, batchPath, planYearCoverageCard } from "./lib/year-coverage-backlog.mjs";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../lib/backlog-lib.cjs");

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const QUEUE_PATH = path.join(PROJECT_ROOT, ".claude/state/data/estat-year-coverage/queue.json");
const BACKLOG_PATH = path.join(PROJECT_ROOT, ".claude/todo/backlog.md");
const args = process.argv.slice(2);
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const byDesignFile = path.join(PROJECT_ROOT, BY_DESIGN_PATH);
const byDesign = fs.existsSync(byDesignFile) ? JSON.parse(fs.readFileSync(byDesignFile, "utf8")) : {};

const markIndex = args.indexOf("--mark-by-design");
if (markIndex >= 0) {
  const key = args[markIndex + 1];
  const note = args[args.indexOf("--note") + 1];
  if (!key || args.indexOf("--note") < 0 || !note) {
    console.error('[err] --mark-by-design <key> --note "<理由>" の両方が要る');
    process.exit(1);
  }
  byDesign[key] = { note, at: today };
  fs.writeFileSync(byDesignFile, `${JSON.stringify(byDesign, null, 2)}\n`);
  console.log(`[ok] by-design に記録: ${key}`);
  process.exit(0);
}

if (!fs.existsSync(QUEUE_PATH)) {
  console.error("[err] 年カバレッジ監査の queue.json が無い。先に audit-estat-year-coverage.ts を実行");
  process.exit(1);
}
const { results } = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const backlog = fs.readFileSync(BACKLOG_PATH, "utf8");
const openIds = parseBacklog(backlog).map((card) => card.id).filter(Boolean);

const card = planYearCoverageCard({ results, openIds, byDesign, today });
if (args.includes("--dry-run")) {
  console.log(card ? card.markdown : "[dry-run] 起票なし (開いているカードがあるか、候補が無い)");
  process.exit(0);
}

const { text, inserted } = insertCards(backlog, card ? [card] : []);
const batchDir = path.join(PROJECT_ROOT, BATCH_DIR);
fs.mkdirSync(batchDir, { recursive: true });
if (inserted.length) {
  fs.writeFileSync(path.join(PROJECT_ROOT, batchPath(card.id)), card.keys.join("\n") + "\n");
  fs.writeFileSync(BACKLOG_PATH, text);
}
const open = new Set([...openIds, ...inserted]);
const stale = fs.readdirSync(batchDir).filter((name) => name.startsWith(`${CARD_PREFIX}-`) && !open.has(name.replace(/\.txt$/, "")));
for (const name of stale) fs.rmSync(path.join(batchDir, name));
console.log(`[ok] 起票 ${inserted.length} 枚${inserted.length ? ` (${inserted[0]})` : ""} / 完了済み batch の削除 ${stale.length} 件`);
