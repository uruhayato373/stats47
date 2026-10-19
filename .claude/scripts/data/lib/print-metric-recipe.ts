/**
 * 手動投入の書き手 (stats-values-writer.mjs) が values.json に焼く取得レシピを、正典の buildRecipe から出す境界。
 * 素の node の .mjs は TS の data-configs を import できないので、ここで JSON にして渡す。
 *
 * Usage: node --import tsx .claude/scripts/data/lib/print-metric-recipe.ts <metricKey>
 */
import { buildRecipe, getMetricConfig } from "@stats47/data-configs";

const key = process.argv[2];
if (!key) {
  console.error("metricKey を指定してください");
  process.exit(1);
}
const config = getMetricConfig(key);
if (!config) {
  console.error(`${key}: metric config がありません (metric の定義ファイルと registry を確認)`);
  process.exit(1);
}
process.stdout.write(JSON.stringify(buildRecipe(config)));
