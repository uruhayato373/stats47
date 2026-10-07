#!/usr/bin/env node
/**
 * critic-findings-digest.mjs — critic の指摘の台帳を型ごとに数え、繰り返す型を backlog に起票する。
 *
 * 窓 (windowDays) の中で、同じ型の BLOCK/MAJOR が minArticles 本以上の記事に出たら、
 * `CRITIC-PATTERN-<型>` のカードを 🟡 に 1 枚足す (同じカードが開いていれば足さない)。
 * カードを閉じるときは、型を規約か gate に入れて `.claude/config/critic-finding-types.json` に
 * promotedAt を書く。以後はその日より後の指摘だけを数える。
 *
 * Usage:
 *   node .claude/scripts/blog/critic-findings-digest.mjs            # 要約を書き、起票する
 *   node .claude/scripts/blog/critic-findings-digest.mjs --dry-run  # 起票するカードを表示するだけ
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";
import { insertCards } from "../gsc/lib/coverage-backlog.mjs";
import { aggregateByType, planPatternCards, renderLatest } from "./lib/critic-findings.mjs";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../lib/backlog-lib.cjs");

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BLOG_DIR = datasetDir("blog.operations");
const LEDGER = path.join(PROJECT_ROOT, BLOG_DIR, "critic-findings.jsonl");
const LATEST = path.join(PROJECT_ROOT, BLOG_DIR, "critic-findings-LATEST.md");
const BACKLOG = path.join(PROJECT_ROOT, ".claude/todo/backlog.md");
const CONFIG = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/config/critic-finding-types.json"), "utf8"));
const DRY_RUN = process.argv.includes("--dry-run");
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const rows = fs.existsSync(LEDGER)
  ? fs
      .readFileSync(LEDGER, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  : [];
const settings = { today, windowDays: CONFIG.windowDays, minArticles: CONFIG.minArticles, types: CONFIG.types };
const aggregate = aggregateByType(rows, settings);

const backlog = fs.readFileSync(BACKLOG, "utf8");
const openIds = parseBacklog(backlog).map((card) => card.id).filter(Boolean);
const cards = planPatternCards(aggregate, {
  ...settings,
  openIds,
  ledgerPath: `${BLOG_DIR}/critic-findings.jsonl`,
});

if (DRY_RUN) {
  console.log(renderLatest(aggregate, { ...settings, totalRows: rows.length }));
  console.log(cards.length ? cards.map((card) => card.markdown).join("\n\n") : "[dry-run] 起票なし");
  process.exit(0);
}

fs.writeFileSync(LATEST, renderLatest(aggregate, { ...settings, totalRows: rows.length }));
const { text, inserted } = insertCards(backlog, cards);
if (inserted.length > 0) fs.writeFileSync(BACKLOG, text);
console.log(`[ok] 型 ${aggregate.length} 種 / 起票 ${inserted.length} 枚${inserted.length ? ` (${inserted.join(", ")})` : ""}`);
