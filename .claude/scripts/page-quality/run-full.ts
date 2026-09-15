/**
 * 週次の全URL監査。sitemap.xmlから公開対象URLを列挙し、並列数を制限して巡回する。
 * audit-site-links.mjs / smoke-test-routes.sh と同じく本番へ直接アクセスする
 * (5000ページ規模をローカルbuildで賄うのはコストが見合わない)。
 * ブラウザ計測(LCP/CLS/INP等)は重いため既定では静的解析のみ (--with-browser で追加、通常は使わない)。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/run-full.ts --base-url https://stats47.jp [--concurrency 4] [--with-browser] [--limit 200]
 *
 * Exit code:
 *   0 = error違反なし
 *   1 = error違反あり
 *   2 = 入力不備・実行時エラー
 */
import { auditUrl } from "./lib/audit-url";
import { currentCommitSha } from "./lib/git-diff";
import { enumerateAllUrls } from "./lib/enumerate-urls";
import { evaluateAll, loadBudgets } from "./lib/thresholds";
import {
  appendHistory,
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
  return {
    baseUrl: get("--base-url") ?? "http://localhost:3100",
    concurrency: Number(get("--concurrency") ?? "4"),
    withBrowser: args.includes("--with-browser"),
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
  const results: PageAuditResult[] = await runWithConcurrency(urls, opts.concurrency, async ({ path, template }) => {
    const result = await auditUrl(opts.baseUrl, path, template, { withBrowser: opts.withBrowser });
    done += 1;
    if (done % 200 === 0) console.log(`  ${done}/${urls.length}`);
    return result;
  });

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
