/**
 * 変更時の軽量検査。git diffから影響テンプレートを判定し、代表URL1件ずつだけ計測する。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/run-representative.ts --base-url http://localhost:3100 [--base origin/main] [--all] [--no-browser] [--runs 1]
 *
 * Exit code:
 *   0 = error違反なし (warningのみは0)
 *   1 = error違反あり
 *   2 = 入力不備・実行時エラー
 */
import { affectedTemplates, PAGE_TEMPLATES } from "./templates";
import { auditUrl } from "./lib/audit-url";
import { checkImages } from "./lib/check-images";
import { createBrowserMeasurementSession } from "./lib/measure-browser";
import { changedFilesSince, currentCommitSha } from "./lib/git-diff";
import { evaluateAll, loadBudgets } from "./lib/thresholds";
import { appendHistory, readPreviousValue, writeLatestJson, writeLatestMarkdown } from "./lib/storage";
import type { AuditRun, MetricKey, PageAuditResult } from "./types";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const browserRuns = Number(get("--runs") ?? "1");
  if (!Number.isInteger(browserRuns) || browserRuns < 1 || browserRuns > 5) {
    throw new Error(`--runs は1〜5の整数で指定してください: ${browserRuns}`);
  }
  const maxTemplatesRaw = get("--max-templates");
  const maxTemplates = maxTemplatesRaw ? Number(maxTemplatesRaw) : undefined;
  if (maxTemplates !== undefined && (!Number.isInteger(maxTemplates) || maxTemplates < 1)) {
    throw new Error(`--max-templates は1以上の整数で指定してください: ${maxTemplatesRaw}`);
  }
  return {
    baseUrl: get("--base-url") ?? "http://localhost:3100",
    diffBase: get("--base") ?? "origin/main",
    all: args.includes("--all"),
    withBrowser: !args.includes("--no-browser"),
    browserRuns,
    maxTemplates,
  };
}

async function main() {
  const opts = parseArgs();
  const changed = opts.all ? [] : changedFilesSince(opts.diffBase);
  let templates = opts.all ? [...PAGE_TEMPLATES] : affectedTemplates(changed);
  if (!opts.all && opts.maxTemplates && templates.length > opts.maxTemplates) {
    const priority = [
      "home",
      "prefecture-detail",
      "theme",
      "ranking",
      "blog",
      "blog-article",
      "geo-analysis",
      "prefecture-list",
      "municipality",
      "category",
      "survey",
      "other",
    ];
    templates = [...templates]
      .sort((left, right) => priority.indexOf(left.key) - priority.indexOf(right.key))
      .slice(0, opts.maxTemplates);
  }

  if (templates.length === 0) {
    console.log(
      `[page-quality] 影響するページテンプレートなし (${changed.length}ファイル変更、${opts.diffBase}比較)。スキップ。`
    );
    return;
  }

  console.log(
    `[page-quality] 対象テンプレート: ${templates.map((t) => t.key).join(", ")} (${opts.all ? "--all" : `${changed.length}ファイル変更`})`
  );

  const generatedAt = new Date().toISOString();
  const results: PageAuditResult[] = [];
  const browserSession = opts.withBrowser ? await createBrowserMeasurementSession() : undefined;
  try {
    for (const template of templates) {
      console.log(`  計測中: ${template.key} ${template.representativeUrl}`);
      const result = await auditUrl(opts.baseUrl, template.representativeUrl, template.key, {
        withBrowser: opts.withBrowser,
        browserSession,
        browserRuns: opts.browserRuns,
      });
      results.push(result);
    }
  } finally {
    await browserSession?.close();
  }

  await checkImages(results);

  const budgets = loadBudgets();
  const date = generatedAt.slice(0, 10);
  const previous = (url: string, metricKey: MetricKey) => readPreviousValue(url, metricKey, date);
  const violations = evaluateAll(results, budgets, previous);

  const run: AuditRun = {
    schemaVersion: 1,
    mode: "representative",
    generated_at: generatedAt,
    commit_sha: currentCommitSha(),
    environment: opts.baseUrl,
    results,
    violations,
  };

  appendHistory(run);
  writeLatestJson(run);
  writeLatestMarkdown(run);

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warnCount = violations.length - errorCount;
  console.log(`[page-quality] 違反: error=${errorCount} warning=${warnCount}`);
  if (errorCount > 0) {
    for (const v of violations.filter((x) => x.severity === "error")) {
      console.error(`  🚨 ${v.url} ${v.metric_key}(${v.comparison}) actual=${v.actual} ${v.operator} ${v.threshold}`);
    }
  }
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`[page-quality] エラー: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
