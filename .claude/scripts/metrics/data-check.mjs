#!/usr/bin/env node
/**
 * 指標を変えたあとに、本番へ出す前に手元で取り込みを確かめる (npm run data:check)。
 *
 *   npm run data:check                         # origin/main から手元までに変えた指標 (未コミットを含む)
 *   npm run data:check -- --metric a,b         # 指標を指定する
 *
 * e-Stat から実際に取り、行の重複・打ち切り・県の欠け・0 件を page-data-batch --dry-run と同じ判定で確かめる。
 * R2 には書かない (書き込みは CI の data-refresh だけ。main に入ったあとは deploy-workers.yml が変えた指標を自動で取り込む)。
 * R2 の書き込みの鍵は使わない。app id は page-data-batch の既定の読み方 (手元の設定ファイル) で決まり、R2 は公開の URL から読む。
 * 公開の R2 と比べるので、既存の値から 0 件や県の数の減少への後退も見つかる。
 * 正典: .claude/rules/metric-config-standards.md「取り込みの確かめと反映」
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { changedMetricKeys } from "../../../packages/ops/src/ci/plan-metric-ingest.mjs";
import { datasetDir } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)("../../../packages/types/mirror/site-config.cjs");

function parseArgs(argv) {
  const i = argv.indexOf("--metric");
  if (i === -1) return { metric: undefined };
  const metric = argv[i + 1];
  if (!metric || metric.startsWith("--")) throw new Error("--metric には key をカンマ区切りで渡す");
  return { metric };
}

const { metric } = parseArgs(process.argv.slice(2));
let keys = metric;
if (!keys) {
  const base = spawnSync("git", ["merge-base", "origin/main", "HEAD"], { cwd: PROJECT_ROOT, encoding: "utf8" }).stdout.trim();
  if (!base) throw new Error("origin/main との分岐点が見つからない。git fetch origin main をしてから実行する");
  keys = changedMetricKeys({ base, cwd: PROJECT_ROOT }).join(",");
  if (!keys) {
    console.log(`origin/main から変えた指標はありません (${datasetDir("metrics.definitions")}/<key>.ts)。指定するなら --metric a,b`);
    process.exit(0);
  }
}
console.log(`[data:check] 確かめる指標: ${keys.split(",").length} 件 (${keys})`);

const env = {
  ...process.env,
  R2_PUBLIC_FETCH_URL: process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL,
};
const result = spawnSync(
  "npx",
  ["tsx", "packages/data-configs/scripts/page-data-batch.ts", "--metric", keys, "--dry-run"],
  { cwd: PROJECT_ROOT, env, stdio: "inherit", shell: process.platform === "win32" },
);
if (result.status === 0) {
  console.log("\n[data:check] 書き込みはしていません。main に入ると deploy-workers.yml が変えた指標を取り込みます。");
}
process.exit(result.status ?? 1);
