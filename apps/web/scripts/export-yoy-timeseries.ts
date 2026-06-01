/**
 * テーマ YoY タイムシリーズ JSON を R2 (app/themes/) に出力する exporter。
 *
 * - 入力: R2 観測値 `app/ranking/<metricKey>/values.json`
 * - 出力: `.local/r2/app/themes/<theme>/yoy-*.json`
 * - バッチ設定: `.claude/config/yoy-batch.json`
 *
 * R2 反映: diff-push-r2 --prefix app/themes (CI)。
 *
 * 実行: npx tsx apps/web/scripts/export-yoy-timeseries.ts
 */
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "../../..");
const SCRIPT = resolve(REPO_ROOT, ".claude/scripts/web/build-yoy-timeseries.cjs");
const BATCH = resolve(REPO_ROOT, ".claude/config/yoy-batch.json");

execSync(`node "${SCRIPT}" --batch "${BATCH}"`, {
  stdio: "inherit",
  cwd: REPO_ROOT,
});
