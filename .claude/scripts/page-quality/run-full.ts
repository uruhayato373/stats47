/**
 * 週次の全URL監査。sitemap.xmlから公開対象URLを列挙し、並列数を制限して巡回する。
 * audit-site-links.mjs / smoke-test-routes.sh と同じく本番へ直接アクセスする
 * (5000ページ規模をローカルbuildで賄うのはコストが見合わない)。
 * ブラウザ計測(LCP/CLS/INP等)は重いため既定では静的解析のみ (--with-browser で全URLに追加、通常は使わない)。
 * --browser-representative はテンプレートごとの代表URLだけをブラウザで開き、文字の切れ・タップ要素の重なり・
 * アクセシビリティ (axe) を追加で見る (週次の既定)。画像切れは全URLで確認する。
 *
 * Usage:
 * --skip-rsc は全URLで RSC payload の取得を省く (RSC は毎回サーバー描画で 1 件 0.5〜3.7 秒かかり、
 * 2026-09-19 の週次は 45 分で 1,200/6,237 URL しか進まなかった)。代表URLのブラウザ検査では RSC も測る。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/run-full.ts --base-url https://stats47.jp [--concurrency 4] [--with-browser | --browser-representative] [--skip-rsc] [--runs 3] [--limit 200]
 *
 * Exit code:
 *   0 = error違反なし
 *   1 = error違反あり
 *   2 = 入力不備・実行時エラー
 */
import { auditUrl } from "./lib/audit-url";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { checkImages } from "./lib/check-images";
import { createScreenshotSession, responsiveFindings, SCREENSHOT_PREFIX } from "./lib/screenshots";
import { buildReviewInput, newUiViolations } from "./lib/ui-report";
import { PAGE_TEMPLATES } from "./templates";
import { createBrowserMeasurementSession } from "./lib/measure-browser";
import { currentCommitSha } from "./lib/git-diff";
import { enumerateAllUrls } from "./lib/enumerate-urls";
import { evaluateAll, loadBudgets } from "./lib/thresholds";
import {
  appendHistory,
  readLatestJson,
  readPreviousValue,
  saveSnapshot,
  writeLatestJson,
  writeLatestMarkdown,
} from "./lib/storage";
import type { AuditRun, MetricKey, PageAuditResult } from "./types";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const browserRuns = Number(get("--runs") ?? "3");
  if (!Number.isInteger(browserRuns) || browserRuns < 1 || browserRuns > 5) {
    throw new Error(`--runs は1〜5の整数で指定してください: ${browserRuns}`);
  }
  return {
    baseUrl: get("--base-url") ?? "http://localhost:3100",
    concurrency: Number(get("--concurrency") ?? "4"),
    withBrowser: args.includes("--with-browser"),
    browserRepresentative: args.includes("--browser-representative"),
    skipRsc: args.includes("--skip-rsc"),
    browserRuns,
    limit: get("--limit") ? Number(get("--limit")) : undefined,
  };
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

/** CI の後続 step (R2 push・agent・Issue) が読む作業ファイルの置き場。git には入れない。 */
const CI_DIR = ".local/ci/page-quality";

/**
 * 代表URLだけブラウザで開き、静的解析の結果へ UI 指標とスクショ (スマホ・PC) を足す。
 * 代表URLが sitemap に無ければ追加する。
 */
async function measureRepresentativesInBrowser(
  results: PageAuditResult[],
  baseUrl: string,
  runs: number,
  date: string
): Promise<void> {
  const session = await createBrowserMeasurementSession();
  const shots = await createScreenshotSession({ date });
  try {
    for (const template of PAGE_TEMPLATES) {
      const browserResult = await auditUrl(baseUrl, template.representativeUrl, template.key, {
        withBrowser: true,
        browserSession: session,
        browserRuns: runs,
      });
      try {
        const captured = await shots.capture(browserResult.url, template.key);
        browserResult.screenshots = captured.records;
        const responsive = responsiveFindings(captured.records);
        browserResult.metrics.responsive_layout_issues = responsive.count;
        browserResult.ui_findings = [
          ...(browserResult.ui_findings ?? []),
          ...captured.failures,
          ...responsive.findings.slice(0, 20),
        ];
      } catch (e) {
        browserResult.ui_findings = [
          ...(browserResult.ui_findings ?? []),
          `screenshot_failed: ${(e as Error).message.split("\n")[0]}`,
        ];
      }
      const index = results.findIndex((r) => r.path === template.representativeUrl);
      if (index >= 0) results[index] = browserResult;
      else results.push(browserResult);
      console.log(`  ブラウザ検査: ${template.key} ${template.representativeUrl}`);
    }
  } finally {
    await session.close();
    await shots.close();
  }
}

async function main() {
  const opts = parseArgs();
  console.log(`[page-quality] sitemap列挙中: ${opts.baseUrl}/sitemap.xml`);
  let urls = await enumerateAllUrls(opts.baseUrl);
  if (urls.length === 0) {
    // sitemap取得やparseが静かに空を返すと「0 URL = 全てPASS」に見えてしまう。
    // 列挙0件はほぼ確実に設定ミス・取得失敗なので、正常終了させず明示的に落とす。
    throw new Error(
      `sitemap.xmlからURLを1件も列挙できませんでした (${opts.baseUrl}/sitemap.xml)。取得失敗を静かに成功と扱わない。`
    );
  }
  if (opts.limit) urls = urls.slice(0, opts.limit);
  console.log(`[page-quality] 対象 ${urls.length} URL / 並列 ${opts.concurrency}`);

  const generatedAt = new Date().toISOString();
  let done = 0;
  const browserSession = opts.withBrowser ? await createBrowserMeasurementSession() : undefined;
  let results: PageAuditResult[];
  try {
    results = await runWithConcurrency(urls, opts.concurrency, async ({ path, template }) => {
      const result = await auditUrl(opts.baseUrl, path, template, {
        withBrowser: opts.withBrowser,
        browserSession,
        browserRuns: opts.browserRuns,
        measureRsc: !opts.skipRsc,
      });
      done += 1;
      if (done % 200 === 0) console.log(`  ${done}/${urls.length}`);
      return result;
    });
  } finally {
    await browserSession?.close();
  }

  if (opts.browserRepresentative && !opts.withBrowser) {
    await measureRepresentativesInBrowser(results, opts.baseUrl, opts.browserRuns, generatedAt.slice(0, 10));
  }

  const images = await checkImages(results);
  console.log(
    `[page-quality] 画像確認: ${images.checked} 件 / 壊れ ${images.broken} / 通信失敗で未確認 ${images.unverified}`
  );

  const budgets = loadBudgets();
  const date = generatedAt.slice(0, 10);
  const previous = (url: string, metricKey: MetricKey) => readPreviousValue(url, metricKey, date);
  const violations = evaluateAll(results, budgets, previous);

  const run: AuditRun = {
    schemaVersion: 1,
    mode: "full",
    generated_at: generatedAt,
    commit_sha: currentCommitSha(),
    environment: opts.baseUrl,
    results,
    violations,
  };

  // 前回の週次結果は上書き前に読む (新しく出た UI 違反だけを通知するため)。
  const previousRun = readLatestJson();
  const fresh = newUiViolations(run, previousRun);
  mkdirSync(CI_DIR, { recursive: true });
  writeFileSync(join(CI_DIR, "ui-new-violations.json"), `${JSON.stringify(fresh, null, 2)}\n`);
  if (opts.browserRepresentative) {
    const input = buildReviewInput(run);
    writeFileSync(join(CI_DIR, "review-input.json"), `${JSON.stringify(input, null, 2)}\n`);
    const latestIndex = join(".local/r2", SCREENSHOT_PREFIX, "latest", "index.json");
    mkdirSync(join(".local/r2", SCREENSHOT_PREFIX, "latest"), { recursive: true });
    writeFileSync(
      latestIndex,
      `${JSON.stringify({ generatedAt, date, pages: input.pages.map((p) => ({ template: p.template, url: p.url })) }, null, 2)}\n`
    );
  }
  console.log(`[page-quality] UI 違反の新規: ${fresh.violations.length} 件${fresh.firstRun ? " (前回結果なし=初回)" : ""}`);

  const snapshotPath = saveSnapshot(run);
  appendHistory(run);
  writeLatestJson(run);
  writeLatestMarkdown(run);

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warnCount = violations.length - errorCount;
  console.log(`[page-quality] スナップショット保存: ${snapshotPath}`);
  console.log(`[page-quality] 違反: error=${errorCount} warning=${warnCount} / 対象 ${results.length} URL`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`[page-quality] エラー: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
