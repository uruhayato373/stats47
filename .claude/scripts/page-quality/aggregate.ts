/**
 * 保存済みスナップショットを現在のbudgets.jsonで再評価し、latest.json/LATEST.mdを再生成する。
 * 再クロールしない。閾値を変更した後の再判定や、管理画面集計の手動再生成に使う。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/aggregate.ts [snapshot-path]
 *   (省略時は snapshots/ 配下の最新ファイル)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { evaluateAll, loadBudgets } from "./lib/thresholds";
import { readPreviousValue, SNAPSHOTS_DIR, writeLatestJson, writeLatestMarkdown } from "./lib/storage";
import type { AuditRun, MetricKey } from "./types";

function latestSnapshotPath(): string {
  if (!existsSync(SNAPSHOTS_DIR)) {
    throw new Error(`No snapshots directory: ${SNAPSHOTS_DIR}`);
  }
  const files = readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) throw new Error(`No snapshot files in ${SNAPSHOTS_DIR}`);
  return join(SNAPSHOTS_DIR, files[0]);
}

function main() {
  const path = process.argv[2] ?? latestSnapshotPath();
  const run = JSON.parse(readFileSync(path, "utf-8")) as AuditRun;

  const budgets = loadBudgets();
  const date = run.generated_at.slice(0, 10);
  const previous = (url: string, metricKey: MetricKey) => readPreviousValue(url, metricKey, date);
  run.violations = evaluateAll(run.results, budgets, previous);

  writeLatestJson(run);
  writeLatestMarkdown(run);

  const errorCount = run.violations.filter((v) => v.severity === "error").length;
  console.log(`[page-quality] ${path} を再評価: error=${errorCount} warning=${run.violations.length - errorCount}`);
}

main();
