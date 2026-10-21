#!/usr/bin/env node
/**
 * R2 書き込みの workflow (`concurrency: group: r2-write`) で、待機中に後続の run へ取り消されて
 * ジョブを 1 つも実行しなかった手動起動を洗い出す (CI-R2-WRITE-PENDING-REPLACED-01)。
 * 判定は `workflow-health-core.mjs` の `findSupersededDispatches`。`workflow-health-daily.yml` が毎日実行し、
 * 見つかれば cron ヘルスの Issue に載せる。
 *
 * 使い方: node .claude/scripts/ci/audit-superseded-dispatches.mjs [--hours 48]
 * 終了コード: 取り消されたまま取り戻されていない起動が 1 件でもあれば 1。取得に失敗しても 1。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findSupersededDispatches } from "../lib/workflow-health-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const WORKFLOW_DIR = path.join(ROOT, ".github/workflows");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function gh(endpoint) {
  return JSON.parse(execFileSync("gh", ["api", endpoint], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }));
}

function r2WriteWorkflows() {
  return fs
    .readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith(".yml") && /group:\s*r2-write\b/.test(fs.readFileSync(path.join(WORKFLOW_DIR, f), "utf8")))
    .sort();
}

function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? "uruhayato373/stats47";
  const hours = Number(arg("hours", "48"));
  const entries = [];
  const errors = [];
  for (const file of r2WriteWorkflows()) {
    try {
      const data = gh(`repos/${repo}/actions/workflows/${encodeURIComponent(file)}/runs?event=workflow_dispatch&per_page=10`);
      const runs = (data.workflow_runs ?? []).map((r) => ({
        id: r.id,
        event: r.event,
        conclusion: r.conclusion,
        createdAt: r.created_at,
        // ジョブ数は取り消された run だけ数える (API 呼び出しを増やさない)
        jobCount: r.conclusion === "cancelled" ? gh(`repos/${repo}/actions/runs/${r.id}/jobs?per_page=1`).total_count : null,
      }));
      entries.push({ workflow: file, runs });
    } catch (error) {
      errors.push(`${file}: ${String(error.message).split("\n")[0]}`);
    }
  }
  const found = findSupersededDispatches(entries, { nowMs: Date.now(), windowHours: hours });
  console.log(`R2 書き込みの手動起動 (直近 ${hours} 時間・${entries.length} workflow): 取り消されたまま ${found.length} 件`);
  for (const f of found) {
    console.log(`- ${f.workflow} run ${f.runId} (${f.createdAt}) — 待機中に後続の run へ取り消され、ジョブ 0 件。入力を確かめて起動し直す`);
    console.log(`  https://github.com/${repo}/actions/runs/${f.runId}`);
  }
  // 「見えなかった」を「問題なし」にしない
  for (const e of errors) console.log(`- 取得失敗: ${e}`);
  process.exit(found.length > 0 || errors.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
