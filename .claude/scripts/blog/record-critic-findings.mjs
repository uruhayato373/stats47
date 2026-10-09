#!/usr/bin/env node
/**
 * record-critic-findings.mjs — review.md の指摘を台帳 (blog.operations の critic-findings.jsonl) に追記する。
 *
 * 呼ぶ場所:
 *   - blog-critic が review.md を書いた直後 (REVISE の指摘は再審で上書きされるので、その前に残す)
 *   - blog-auto-publish.yml の outbox 掃除の直前 (最後の review.md を残す。二重に呼んでも重複しない)
 *
 * Usage:
 *   node .claude/scripts/blog/record-critic-findings.mjs <review.md | 記事ディレクトリ>...
 *
 * 同じ review.md を何度記録しても同じ行は増えない (指摘ごとの key で判定)。
 * 判定の説明と型の語彙: `.claude/scripts/blog/lib/critic-findings.mjs` / `.claude/config/critic-finding-types.json`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";
import { parseReview, reviewProblems, toLedgerRows } from "./lib/critic-findings.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const LEDGER = path.join(PROJECT_ROOT, datasetDir("blog.operations"), "critic-findings.jsonl");
const TYPES = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/config/critic-finding-types.json"), "utf8"));

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: record-critic-findings.mjs <review.md | 記事ディレクトリ>...");
  process.exit(1);
}

const existing = new Set(
  fs.existsSync(LEDGER)
    ? fs
        .readFileSync(LEDGER, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line).key)
    : [],
);

const added = [];
const failures = [];
for (const target of targets) {
  const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, "review.md") : target;
  if (!fs.existsSync(file)) {
    console.warn(`[skip] review.md が無い: ${file}`);
    continue;
  }
  const review = parseReview(fs.readFileSync(file, "utf8"), {
    slug: path.basename(path.dirname(path.resolve(file))),
    knownTypes: Object.keys(TYPES.types),
  });
  const problems = reviewProblems(review);
  if (problems.length > 0) {
    failures.push(...problems.map((problem) => `${file}: ${problem}`));
    continue;
  }
  for (const row of toLedgerRows(review)) {
    if (existing.has(row.key)) continue;
    existing.add(row.key);
    added.push(row);
  }
}

if (added.length > 0) {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.appendFileSync(LEDGER, added.map((row) => JSON.stringify(row)).join("\n") + "\n");
}
const unclassified = added.filter((row) => row.type === "unclassified").length;
console.log(
  `[ok] 追記 ${added.length} 件${unclassified ? ` (型の無い指摘 ${unclassified} 件: review.md の指摘に [型:<key>] を付けると数えられる)` : ""}`,
);
if (failures.length > 0) {
  for (const failure of failures) console.error(`[fail] ${failure}`);
  process.exit(1);
}
