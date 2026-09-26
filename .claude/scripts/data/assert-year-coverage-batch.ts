/**
 * YEAR-COV カードの completion gate。batch の全 key が「config で複数年になった」か
 * 「by-design に理由付きで記録された」なら exit 0。1 件でも残れば一覧を出して exit 1。
 *
 * Usage: npx tsx .claude/scripts/data/assert-year-coverage-batch.ts <batch.txt>
 */
import fs from "node:fs";
import path from "node:path";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import type { MetricConfig } from "@stats47/data-configs";

import { yearSpecCount } from "../../../packages/ranking/src/scripts/audit-estat-year-coverage";
import { BY_DESIGN_PATH, unhandledKeys } from "./lib/year-coverage-backlog.mjs";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const batchFile = process.argv[2];
if (!batchFile) {
  console.error("[err] batch ファイルを渡す");
  process.exit(1);
}
const keys = fs.readFileSync(path.resolve(PROJECT_ROOT, batchFile), "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const byDesignFile = path.join(PROJECT_ROOT, BY_DESIGN_PATH);
const byDesign = fs.existsSync(byDesignFile) ? JSON.parse(fs.readFileSync(byDesignFile, "utf8")) : {};
const registry = METRICS_REGISTRY as Record<string, MetricConfig>;

const left = unhandledKeys(keys, {
  byDesign,
  yearCountOf: (key: string) => (registry[key] ? yearSpecCount(registry[key].years) : undefined),
});
if (left.length) {
  console.error(`[fail] 未処理 ${left.length}/${keys.length} 件: ${left.join(", ")}`);
  process.exit(1);
}
console.log(`[ok] ${keys.length} 件すべて処理済み`);
