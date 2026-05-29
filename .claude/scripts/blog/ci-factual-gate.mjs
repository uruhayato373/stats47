#!/usr/bin/env node
/**
 * CI 用 factual gate。docs/21_ブログ記事原稿/<slug> のドラフトに対し
 * article-factual-check.mjs (library) を実行し、blockers があれば exit 1。
 *
 * 公開パイプライン (publish-blog.yml) が prod R2 へ push する前のゲート。
 * AI 生成記事の約13%が rank 不整合 / 数値捏造で FAIL する実測値があるため必須。
 *
 * Usage: node .claude/scripts/blog/ci-factual-gate.mjs <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkArticleFactual } from "../lib/article-factual-check.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: ci-factual-gate.mjs <slug>");
  process.exit(2);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const dir = path.join(ROOT, "docs/21_ブログ記事原稿", slug);
const articlePath = path.join(dir, "article.md");

if (!fs.existsSync(articlePath)) {
  console.error(`[ci-factual-gate] ドラフトが見つかりません: ${articlePath}`);
  process.exit(2);
}

const content = fs.readFileSync(articlePath, "utf8");
const result = checkArticleFactual(content, path.join(dir, "data"));

console.log(
  `[ci-factual-gate] ${slug}: blockers=${result.blockers.length} warnings=${result.warnings.length} prefCount=${result.groundTruthPrefCount} perCapita=${result.isPerCapitaArticle}`,
);
result.blockers.forEach((b) => console.error("  ❌ blocker:", b));
result.warnings.forEach((w) => console.warn("  ⚠️  warning:", w));

if (result.blockers.length > 0) {
  console.error("[ci-factual-gate] ❌ factual gate FAILED — publish 中止");
  process.exit(1);
}
console.log("[ci-factual-gate] ✅ factual gate passed");
