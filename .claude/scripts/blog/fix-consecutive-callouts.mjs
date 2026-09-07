#!/usr/bin/env node
/**
 * 連続 callout を決定的に是正する。
 * 最重要の1つだけを callout に残し、他はラベル付き通常本文へ戻す。
 * デフォルトは dry-run。書き込みは --apply 指定時のみ。
 *
 * Usage:
 *   node .claude/scripts/blog/fix-consecutive-callouts.mjs
 *   node .claude/scripts/blog/fix-consecutive-callouts.mjs --base docs/21_ブログ記事原稿 --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  lintConsecutiveCallouts,
  normalizeConsecutiveCallouts,
} from "../lib/article-structure-lint.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const base = path.resolve(projectRoot, argValue("--base", "docs/21_ブログ記事原稿"));
const apply = args.includes("--apply");

if (!fs.existsSync(base)) {
  console.error(`[error] base dir not found: ${base}`);
  process.exit(2);
}

const changed = [];
for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const articlePath = path.join(base, entry.name, "article.md");
  if (!fs.existsSync(articlePath)) continue;

  const before = fs.readFileSync(articlePath, "utf8");
  const beforeLint = lintConsecutiveCallouts(before);
  if (beforeLint.stats.adjacentCalloutClusters === 0) continue;

  const after = normalizeConsecutiveCallouts(before);
  const afterLint = lintConsecutiveCallouts(after);
  if (afterLint.stats.adjacentCalloutClusters !== 0) {
    throw new Error(`${entry.name}: normalization left adjacent callouts`);
  }
  if (apply) fs.writeFileSync(articlePath, after, "utf8");
  changed.push({
    slug: entry.name,
    clusters: beforeLint.stats.adjacentCalloutClusters,
    pairs: beforeLint.stats.adjacentCalloutPairs,
  });
}

const clusterCount = changed.reduce((sum, item) => sum + item.clusters, 0);
const pairCount = changed.reduce((sum, item) => sum + item.pairs, 0);
console.log(
  `${apply ? "fixed" : "would fix"}: ${changed.length} articles / ${clusterCount} clusters / ${pairCount} pairs`,
);
for (const item of changed) console.log(`- ${item.slug}: ${item.clusters} cluster(s), ${item.pairs} pair(s)`);
