#!/usr/bin/env node
/**
 * 問いの分析の工程を検査する (npm run analysis:check)。
 * 視点の台帳を持たない分析は警告にとどめ、持つ分析は揃うまで止める。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";
import { analysisCycleErrors } from "./analysis-cycle-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const readIfExists = (path) => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : null);

/** quality-gate と CLI が同じ判定を読む。slug を渡すとその記事の分析だけを見る */
export function checkAnalyses(slug) {
  const { analyses } = readJson(datasetPath("content.analyses"));
  const { issues } = readJson(datasetPath("content.issues"));
  const { figures } = readJson(datasetPath("content.figures"));
  const { layers } = readJson(datasetPath("content.analysis-viewpoints"));
  const errors = [];
  const warnings = [];
  for (const analysis of analyses.filter((a) => !slug || a.article?.slug === slug)) {
    if (!analysis.stage) {
      warnings.push(`${analysis.id}: 工程と視点の台帳が無い`);
      continue;
    }
    const dir = analysis.article ? `contents/blog/${analysis.article.slug}` : null;
    const summaryText = dir ? readIfExists(`${dir}/data/analysis-summary.json`) : null;
    const problems = analysisCycleErrors({
      analysis,
      issue: issues.find((issue) => issue.id === analysis.issue) ?? { question: "" },
      layers,
      summary: summaryText ? JSON.parse(summaryText) : {},
      figures: figures.filter((figure) => figure.analysis === analysis.id),
      article: dir ? readIfExists(`${dir}/article.md`) : null,
      review: dir ? readIfExists(`${dir}/review.md`) : null,
    });
    errors.push(...problems.map((problem) => `${analysis.id}: ${problem}`));
  }
  return { errors, warnings };
}

if (process.argv[1]?.endsWith("check-analysis-cycle.mjs")) {
  const { errors, warnings } = checkAnalyses();
  for (const warning of warnings) console.log(`! ${warning}`);
  for (const error of errors) console.error(`✗ ${error}`);
  if (errors.length) process.exit(1);
  console.log("✓ 問いの分析の工程は揃っている");
}
