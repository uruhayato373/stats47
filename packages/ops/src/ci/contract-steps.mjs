/**
 * main への PR の Contract Tests (pr-quality-check.yml の contract-tests job) と同じ段を、develop への push でも回す
 * (CI-CONTRACT-TESTS-DEVELOP-GAP-01)。
 *
 * なぜ要るか: 2026-11-11 の PR #1251 で、契約テスト 1 件 (prune-state-snapshots.test.mjs) が落ちてマージが止まった。
 * 原因は約 1 日前に develop へ入った台帳の整理で、develop の検査 (develop-quality-gate.yml) には契約テストが無いため
 * 誰も気づけなかった。しかも PR の job は最初の失敗で止まるので、後ろの約 15 段は 1 回目の PR では走っていなかった。
 *
 * 段の一覧を develop 側に書き写すと、手で同期する二重管理になり必ずずれる。ここでは PR の workflow を読んで、
 * 条件 (`if:`) の無い `run:` の段をそのまま順に実行する。1 段が落ちても後ろの段を続け、落ちた段を全部報告する。
 * `if:` の付いた段 (依存の入れ直し・差分連動の段) は PR の判定に依存するので develop では回さない。
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import YAML from "yaml";

export const SOURCE_WORKFLOW = ".github/workflows/pr-quality-check.yml";
export const SOURCE_JOB = "contract-tests";

/**
 * 条件の無い run 段だけを、書かれた順に返す
 * @param {any} workflow YAML を読んだ workflow
 * @param {string} [jobId]
 * @returns {{ name: string, run: string, env: Record<string, string> }[]}
 */
export function selectContractSteps(workflow, jobId = SOURCE_JOB) {
  const job = workflow?.jobs?.[jobId];
  if (!job || !Array.isArray(job.steps)) throw new Error(`${jobId} job が見つからない`);
  return job.steps
    .filter((step) => typeof step.run === "string" && step.if === undefined)
    .map((step) => ({ name: String(step.name ?? step.run.split("\n")[0]), run: step.run, env: { ...(step.env ?? {}) } }));
}

/**
 * 段を順に実行し、落ちても続ける
 * @param {{ name: string, run: string, env: Record<string, string> }[]} steps
 * @param {(step: { name: string, run: string, env: Record<string, string> }) => number} execute 終了コードを返す
 */
export function runAllSteps(steps, execute) {
  return steps.map((step) => {
    const started = Date.now();
    const code = execute(step);
    return { name: step.name, code, seconds: Math.round((Date.now() - started) / 1000) };
  });
}

/** @param {{ name: string, code: number, seconds: number }[]} results */
export function summarize(results) {
  const failed = results.filter((result) => result.code !== 0);
  const lines = [
    `### Contract Tests (${SOURCE_WORKFLOW} の ${SOURCE_JOB} と同じ段)`,
    "",
    "| 段 | 結果 | 秒 |",
    "|---|---|---|",
    ...results.map((result) => `| ${result.name} | ${result.code === 0 ? "pass" : `fail (exit ${result.code})`} | ${result.seconds} |`),
    "",
    failed.length === 0 ? `${results.length} 段すべて通った` : `${results.length} 段のうち ${failed.length} 段が落ちた: ${failed.map((result) => result.name).join(" / ")}`,
  ];
  return { failed, text: lines.join("\n") };
}

function bashExecute(step) {
  console.log(`\n::group::${step.name}`);
  const child = spawnSync("bash", ["-eo", "pipefail", "-c", step.run], {
    stdio: "inherit",
    env: { ...process.env, ...step.env },
  });
  console.log("::endgroup::");
  if (child.status !== 0) console.log(`::error::${step.name} が落ちた (exit ${child.status ?? "signal"})`);
  return child.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const workflow = YAML.parse(readFileSync(SOURCE_WORKFLOW, "utf8"));
  const steps = selectContractSteps(workflow);
  if (process.argv.includes("--list")) {
    for (const step of steps) console.log(step.name);
    process.exit(0);
  }
  const { failed, text } = summarize(runAllSteps(steps, bashExecute));
  console.log(`\n${text}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}
