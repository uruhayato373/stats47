#!/usr/bin/env node
/**
 * improvement-cycle-weekly.yml の無人 triage run の提案を台帳へ適用し、差分を検査して結果を state に残す。
 *
 * Usage:
 *   node .claude/scripts/metrics/verify-improvement-cycle-run.mjs --base <sha> --week 2026-W39 [--run-url URL]
 *     [--proposal .local/ci/improvement-cycle/proposal.json] [--execution-file <claude-execution-output.json>]
 *
 * --proposal: Claude が書いた変更提案を lib/improvement-cycle-proposal.mjs で適用してから検査する。
 *   指定したのにファイルが無い・不正なら違反 (Claude が判断を書かずに終わった run を通さない)。
 * --execution-file: Claude のファイル書き込みが権限で拒否されていたら違反にする。
 * 出力: .claude/state/metrics/measurement-cycle/triage-latest.json (週次メトリクス Issue が読む)
 * 終了コード: 違反は 1 (commit しない)。判定ロジックは lib/improvement-cycle-{proposal,gate}.mjs。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeClaudeExecution } from "../lib/summarize-claude-execution.mjs";
import { PROJECT_ROOT } from "./lib/auth.mjs";
import { evaluateRun } from "./lib/improvement-cycle-gate.mjs";
import { applyProposal } from "./lib/improvement-cycle-proposal.mjs";

const IMPROVEMENTS = ".claude/todo/improvements.md";
const BACKLOG = ".claude/todo/backlog.md";
const SKILLS = ".claude/skills/analytics";
const logPath = (skill) => `${SKILLS}/${skill}/reference/improvement-log.md`;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: PROJECT_ROOT, encoding: "utf8" });
const lines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

function showAt(base, path) {
  try { return git("show", `${base}:${path}`); } catch { return ""; }
}

const read = (path) => (existsSync(join(PROJECT_ROOT, path)) ? readFileSync(join(PROJECT_ROOT, path), "utf8") : "");

/** 提案を適用して台帳を書き換える。違反があれば何も書かずに違反を返す。 */
function applyProposalFile(proposalPath, week) {
  if (!existsSync(proposalPath)) return { problems: [`提案ファイルが無い (${proposalPath})。Claude が判断を書かずに終わった`] };
  let proposal;
  try {
    proposal = JSON.parse(readFileSync(proposalPath, "utf8"));
  } catch (error) {
    return { problems: [`提案ファイルを JSON として読めない: ${error.message}`] };
  }
  const skills = readdirSync(join(PROJECT_ROOT, SKILLS)).filter((d) => d.endsWith("-improvement") && existsSync(join(PROJECT_ROOT, logPath(d))));
  const logs = Object.fromEntries(skills.map((d) => [d, read(logPath(d))]));
  const result = applyProposal({ improvements: read(IMPROVEMENTS), backlog: read(BACKLOG), logs }, proposal, { week });
  if (result.problems.length) return result;
  writeFileSync(join(PROJECT_ROOT, IMPROVEMENTS), result.improvements);
  writeFileSync(join(PROJECT_ROOT, BACKLOG), result.backlog);
  for (const [skill, text] of Object.entries(result.logs)) writeFileSync(join(PROJECT_ROOT, logPath(skill)), text);
  return result;
}

/** 実行ログが無い・読めないときは拒否 0 件ではなく「見ていない」ので空を返す (dry run はログを持たない)。 */
function readDenials(executionFile) {
  if (!executionFile || !existsSync(executionFile)) return [];
  try {
    return summarizeClaudeExecution(JSON.parse(readFileSync(executionFile, "utf8"))).denialRows;
  } catch {
    return [];
  }
}

function main() {
  const base = arg("--base");
  const week = arg("--week");
  if (!base || !/^\d{4}-W\d{2}$/.test(week ?? "")) throw new Error("--base <sha> と --week YYYY-Www が必要");
  const outPath = ".claude/state/metrics/measurement-cycle/triage-latest.json";
  const proposalPath = arg("--proposal");
  const applied = proposalPath ? applyProposalFile(proposalPath, week) : { problems: [] };
  const untracked = lines(git("ls-files", "--others", "--exclude-standard")).filter((f) => f !== outPath);
  const changedFiles = [...new Set([...lines(git("diff", "--name-only", base)), ...untracked])].filter((f) => f !== outPath);
  // 未追跡ファイルは git diff に出ないので、全行を追加行として秘密検査に含める
  const untrackedAsDiff = untracked.map((f) => read(f).split("\n").map((l) => `+${l}`).join("\n")).join("\n");
  const result = evaluateRun({
    changedFiles,
    beforeImprovements: showAt(base, IMPROVEMENTS),
    afterImprovements: read(IMPROVEMENTS),
    beforeBacklog: showAt(base, BACKLOG),
    afterBacklog: read(BACKLOG),
    diffText: `${git("diff", base)}\n${untrackedAsDiff}`,
    denials: readDenials(arg("--execution-file")),
  });
  const problems = [...applied.problems, ...result.problems];
  const state = {
    schemaVersion: 1,
    week,
    base,
    runUrl: arg("--run-url") ?? null,
    generatedAt: new Date().toISOString(),
    gate: problems.length ? "fail" : "pass",
    proposal: proposalPath ? (applied.summary ?? null) : null,
    problems,
    changedFiles,
    improvements: result.improvements,
    backlogAdded: result.backlogAdded,
  };
  mkdirSync(join(PROJECT_ROOT, ".claude/state/metrics/measurement-cycle"), { recursive: true });
  writeFileSync(join(PROJECT_ROOT, outPath), JSON.stringify(state, null, 2) + "\n");
  const i = result.improvements;
  console.log(`[improvement-cycle] gate=${state.gate} deleted=${i.deleted.length} updated=${i.updated.length} added=${i.added.length} backlogAdded=${result.backlogAdded.length}`);
  for (const p of problems) console.log(`::error::${p}`);
  if (problems.length) process.exit(1);
}

main();
