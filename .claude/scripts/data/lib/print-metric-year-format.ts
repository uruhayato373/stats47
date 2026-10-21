/**
 * 手動投入の書き手 (stats-values-writer.mjs) が yearName を「YYYY年」「YYYY年度」にそろえるため、指標定義の yearFormat を出す境界。
 * 素の node の .mjs は TS の data-configs を import できないので、ここで JSON にして渡す。
 *
 * Usage: node --import tsx .claude/scripts/data/lib/print-metric-year-format.ts <metricKey>
 */
import { getMetricConfig } from "@stats47/data-configs";

const key = process.argv[2];
const config = key ? getMetricConfig(key) : undefined;
if (!config) {
  console.error(`${key}: metric config がありません (metric の定義ファイルと registry を確認)`);
  process.exit(1);
}
process.stdout.write(JSON.stringify({ yearFormat: config.yearFormat ?? null }));
