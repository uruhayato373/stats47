#!/usr/bin/env node
/**
 * 連続失敗している scheduled workflow を洗い出す (cron 横断ヘルスチェック)。
 *
 * ★なぜ要るか (2026-08-13)
 * この repo のアラートは workflow ごとに自前で Issue を立てる設計なので、
 * **アラート自身が壊れると誰も気づけない**。sync-rakuten-catalog は
 * `rakuten-alert` ラベル未登録で `gh issue create` が落ち続け、日次同期が
 * 9 日間死んでいたことを 9 日間誰も知らなかった。ここは個々のアラートに
 * 依存せず run 履歴だけを見るので、どの cron が死んでも捕まえられる。
 *
 * 使い方:
 *   node .claude/scripts/ci/audit-workflow-health.mjs [--min-streak 2] [--runs 12] [--json]
 *
 * 対象は `.github/workflows/*.yml` のうち `on.schedule` を持つもの (リポジトリの
 * ファイルから決める。API の workflow 一覧は削除済みのものも返すため)。
 * run の取得は `gh api` (CI では GH_TOKEN が入っている)。
 *
 * 終了コード: unhealthy が 1 件でもあれば 1。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateAll, formatReport, isScheduled } from "../lib/workflow-health-core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const WORKFLOW_DIR = path.join(ROOT, ".github/workflows");
const STATE_DIR = path.join(ROOT, ".claude/state/ci");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** on.schedule を持つ workflow のファイル名 */
function scheduledWorkflows() {
  return fs
    .readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith(".yml"))
    // 判定は core が単一実装 (ここで書き写すとテストと食い違う)
    .filter((f) => isScheduled(fs.readFileSync(path.join(WORKFLOW_DIR, f), "utf8")))
    .sort();
}

function gh(endpoint) {
  const out = execFileSync("gh", ["api", endpoint], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

function fetchRuns(repo, workflowFile, perPage) {
  // event=schedule に絞る。push / dispatch の成否は cron の健全性ではない。
  const endpoint =
    `repos/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}` +
    `/runs?event=schedule&per_page=${perPage}`;
  try {
    const data = gh(endpoint);
    return (data.workflow_runs ?? []).map((r) => ({
      id: r.id,
      conclusion: r.conclusion,
      createdAt: r.created_at,
      runStartedAt: r.run_started_at,
      updatedAt: r.updated_at,
    }));
  } catch (error) {
    // 取得できないことを「健全」と混同しない。呼び元で失敗として扱う。
    throw new Error(`${workflowFile}: run 取得に失敗 (${error.message.split("\n")[0]})`);
  }
}

function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? "uruhayato373/stats47";
  const minStreak = Number(arg("min-streak", "2"));
  const perPage = Number(arg("runs", "12"));
  const files = scheduledWorkflows();
  if (files.length === 0) {
    console.error("::error::scheduled workflow を 1 件も見つけられない = 収集が壊れている");
    process.exit(1);
  }

  const entries = [];
  const fetchErrors = [];
  for (const file of files) {
    try {
      entries.push({ workflow: file, runs: fetchRuns(repo, file, perPage) });
    } catch (error) {
      fetchErrors.push(error.message);
    }
  }

  const summary = evaluateAll(entries, { nowMs: Date.now(), minStreak });
  const report = formatReport(summary, { repoUrl: `https://github.com/${repo}` });
  console.log(report);
  if (fetchErrors.length > 0) {
    console.log(`\n取得できなかった workflow ${fetchErrors.length} 件 (健全とみなさない):`);
    fetchErrors.forEach((m) => console.log(`- ${m}`));
  }

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(STATE_DIR, "workflow-health.json"),
    `${JSON.stringify(
      { generatedAt, minStreak, perPage, checked: summary.checked, fetchErrors, results: summary.results },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(STATE_DIR, "LATEST.md"),
    `# cron ヘルスチェック\n\n取得: ${generatedAt}\n\n\`\`\`\n${report}\n\`\`\`\n`,
  );

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(summary.unhealthy, null, 2));
  }
  // 取得失敗も赤にする。「見えなかった」を「問題なし」にしない。
  process.exit(summary.unhealthy.length > 0 || fetchErrors.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
