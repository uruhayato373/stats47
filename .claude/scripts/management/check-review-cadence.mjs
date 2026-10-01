#!/usr/bin/env node
/**
 * 週次・月次レビューと計画の期限・本文の契約・申し送りの振り分け・配線を検査する (旧 check-weekly-cadence.mjs)。
 * 判定は lib/review-cadence.mjs、正本は .claude/config/review-wiring.json。
 *
 * 背景: 計測の収集 (fetch-metrics-weekly.yml) と無人記録 (improvement-cycle-weekly.yml) は自動で回るが、
 * レビューと計画は /weekly-review・/monthly-review・/weekly-plan・/monthly-plan を人が起動して書く。
 * 2026-W26〜W28 はレビューが 3 週続けて欠け、月次の振り返りは月次計画の 1 節に埋もれて検査されていなかった。
 *
 * 使い方:
 *   node .claude/scripts/management/check-review-cadence.mjs                 # 人間向け (error があれば exit 1)
 *   node .claude/scripts/management/check-review-cadence.mjs --json          # 機械向け JSON (常に exit 0)
 *   node .claude/scripts/management/check-review-cadence.mjs --date 2026-10-05
 *   node .claude/scripts/management/check-review-cadence.mjs --strict        # warn (過去のレビュー) も exit 1
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatCadence, reviewCadence } from "./lib/review-cadence.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const dateArg = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;
if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error(`--date は YYYY-MM-DD で指定する: ${dateArg}`);
  process.exit(2);
}
// --date は JST のその日の正午として扱う
const now = dateArg ? new Date(`${dateArg}T12:00:00+09:00`) : new Date();
const result = reviewCadence(ROOT, now);
const body = formatCadence(result);

// process.exit() はパイプへの書き込みを切り捨てる (JSON が途中で切れた)。終了コードは exitCode で返す
if (args.includes("--json")) {
  process.stdout.write(`${JSON.stringify({ ...result, body }, null, 2)}\n`);
} else {
  console.log(body);
  const failing = result.findings.filter((f) => f.severity === "error" || args.includes("--strict"));
  process.exitCode = failing.length ? 1 : 0;
}
