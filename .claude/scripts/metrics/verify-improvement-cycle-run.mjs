#!/usr/bin/env node
/**
 * improvement-cycle-weekly.yml の無人 triage run の差分を検査し、結果を state に残す。
 *
 * Usage:
 *   node .claude/scripts/metrics/verify-improvement-cycle-run.mjs --base <sha> --week 2026-W39 [--run-url URL]
 *
 * 出力: .claude/state/metrics/measurement-cycle/triage-latest.json (週次メトリクス Issue が読む)
 * 終了コード: ゲート違反は 1 (commit しない)。判定ロジックは lib/improvement-cycle-gate.mjs。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "./lib/auth.mjs";
import { evaluateRun } from "./lib/improvement-cycle-gate.mjs";

const IMPROVEMENTS = ".claude/todo/improvements.md";
const BACKLOG = ".claude/todo/backlog.md";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: PROJECT_ROOT, encoding: "utf8" });
const lines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

function showAt(base, path) {
  try { return git("show", `${base}:${path}`); } catch { return ""; }
}

function main() {
  const base = arg("--base");
  const week = arg("--week");
  if (!base || !/^\d{4}-W\d{2}$/.test(week ?? "")) throw new Error("--base <sha> と --week YYYY-Www が必要");
  const outPath = ".claude/state/metrics/measurement-cycle/triage-latest.json";
  const untracked = lines(git("ls-files", "--others", "--exclude-standard")).filter((f) => f !== outPath);
  const changedFiles = [...new Set([...lines(git("diff", "--name-only", base)), ...untracked])].filter((f) => f !== outPath);
  const read = (path) => (existsSync(join(PROJECT_ROOT, path)) ? readFileSync(join(PROJECT_ROOT, path), "utf8") : "");
  // 未追跡ファイルは git diff に出ないので、全行を追加行として秘密検査に含める
  const untrackedAsDiff = untracked.map((f) => read(f).split("\n").map((l) => `+${l}`).join("\n")).join("\n");
  const result = evaluateRun({
    changedFiles,
    beforeImprovements: showAt(base, IMPROVEMENTS),
    afterImprovements: read(IMPROVEMENTS),
    beforeBacklog: showAt(base, BACKLOG),
    afterBacklog: read(BACKLOG),
    diffText: `${git("diff", base)}\n${untrackedAsDiff}`,
  });
  const state = {
    schemaVersion: 1,
    week,
    base,
    runUrl: arg("--run-url") ?? null,
    generatedAt: new Date().toISOString(),
    gate: result.problems.length ? "fail" : "pass",
    problems: result.problems,
    changedFiles,
    improvements: result.improvements,
    backlogAdded: result.backlogAdded,
  };
  mkdirSync(join(PROJECT_ROOT, ".claude/state/metrics/measurement-cycle"), { recursive: true });
  writeFileSync(join(PROJECT_ROOT, outPath), JSON.stringify(state, null, 2) + "\n");
  const i = result.improvements;
  console.log(`[improvement-cycle] gate=${state.gate} deleted=${i.deleted.length} updated=${i.updated.length} added=${i.added.length} backlogAdded=${result.backlogAdded.length}`);
  for (const p of result.problems) console.log(`::error::${p}`);
  if (result.problems.length) process.exit(1);
}

main();
