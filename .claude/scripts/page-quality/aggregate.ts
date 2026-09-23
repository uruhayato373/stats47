/**
 * 保存済みスナップショットを現在のbudgets.jsonで再評価し、latest.json/LATEST.mdを再生成する。
 * 再クロールしない。閾値を変更した後の再判定や、管理画面集計の手動再生成に使う。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/aggregate.ts [snapshot-path]
 *   (省略時は R2 から取得した live/latest.json、無ければ git の代表URL結果)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { evaluateAll, loadBudgets } from "./lib/thresholds";
import { LATEST_JSON, LIVE_DIR, readPreviousValue, writeLatestJson, writeLatestMarkdown } from "./lib/storage";
import type { AuditRun, MetricKey } from "./types";

/** 週次全件の結果は R2 にある (`npm run state:pull -- page-quality` で live/ へ)。無ければ git の代表URL結果。 */
function defaultInputPath(): string {
  const live = join(LIVE_DIR, "latest.json");
  if (existsSync(live)) return live;
  if (existsSync(LATEST_JSON)) return LATEST_JSON;
  throw new Error(`再評価する結果がありません。npm run state:pull -- page-quality で ${live} を取得してください`);
}

function main() {
  const path = process.argv[2] ?? defaultInputPath();
  const run = JSON.parse(readFileSync(path, "utf-8")) as AuditRun;

  const budgets = loadBudgets();
  const date = run.generated_at.slice(0, 10);
  const historyPath = run.mode === "full" ? join(LIVE_DIR, "history.csv") : undefined;
  const previous = (url: string, metricKey: MetricKey) => readPreviousValue(url, metricKey, date, historyPath);
  run.violations = evaluateAll(run.results, budgets, previous);

  // 全件の結果は git に置かない (10MB になる)。集約の LATEST.md だけ書き直す。
  if (run.mode !== "full") writeLatestJson(run);
  writeLatestMarkdown(run);

  const errorCount = run.violations.filter((v) => v.severity === "error").length;
  console.log(`[page-quality] ${path} を再評価: error=${errorCount} warning=${run.violations.length - errorCount}`);
}

main();
