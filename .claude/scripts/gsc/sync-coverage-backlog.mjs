#!/usr/bin/env node
/**
 * sync-coverage-backlog.mjs — GSC カバレッジ是正キューの「判断が要る pending」をバックログカードにする。
 *
 * 起票したカードは backlog-loop-daily (CI の Claude) が 1 日 2 件の枠で処理し、
 * `build-coverage-queue.mjs --assert-handled <batch>` を completion gate にして行を消す。
 * action ごとに開いているカードは 1 枚まで。消化されたら次の実行で次の batch を起票する。
 * 完了したカードの batch ファイルはここで消す。
 *
 * Usage:
 *   node .claude/scripts/gsc/sync-coverage-backlog.mjs            # 起票 + 古い batch の掃除
 *   node .claude/scripts/gsc/sync-coverage-backlog.mjs --dry-run  # 起票するカードを表示するだけ
 *
 * 正典: .claude/skills/analytics/gsc-coverage-remediation/SKILL.md
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import {
  BATCH_DIR,
  batchPath,
  insertCards,
  planCoverageCards,
  staleBatchFiles,
} from "./lib/coverage-backlog.mjs";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../lib/backlog-lib.cjs");

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const QUEUE_PATH = path.join(PROJECT_ROOT, ".claude/state/gsc/coverage-remediation-queue.json");
const BACKLOG_PATH = path.join(PROJECT_ROOT, ".claude/todo/backlog.md");
const dryRun = process.argv.includes("--dry-run");

const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

if (!fs.existsSync(QUEUE_PATH)) {
  console.error("[err] 是正キューが無い。先に build-coverage-queue.mjs を実行");
  process.exit(1);
}
const { queue } = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const backlog = fs.readFileSync(BACKLOG_PATH, "utf8");
const openIds = parseBacklog(backlog).map((card) => card.id).filter(Boolean);

const cards = planCoverageCards({ queue, openIds, today });
if (dryRun) {
  for (const card of cards) console.log(`${card.markdown}\n`);
  console.log(`[dry-run] 起票予定 ${cards.length} 枚`);
  process.exit(0);
}

const { text, inserted } = insertCards(backlog, cards);
const batchDir = path.join(PROJECT_ROOT, BATCH_DIR);
fs.mkdirSync(batchDir, { recursive: true });
for (const card of cards.filter((c) => inserted.includes(c.id))) {
  fs.writeFileSync(path.join(PROJECT_ROOT, batchPath(card.id)), card.urls.join("\n") + "\n");
}
if (inserted.length) fs.writeFileSync(BACKLOG_PATH, text);

const stillOpen = [...openIds, ...inserted];
const stale = staleBatchFiles(fs.readdirSync(batchDir), stillOpen);
for (const name of stale) fs.rmSync(path.join(batchDir, name));

console.log(
  `[ok] 起票 ${inserted.length} 枚${inserted.length ? ` (${inserted.join(", ")})` : ""} / ` +
    `完了済み batch の削除 ${stale.length} 件`
);
