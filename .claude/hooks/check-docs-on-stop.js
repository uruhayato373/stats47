#!/usr/bin/env node
"use strict";

/**
 * Claude Code Stop hook:
 * 文書関連のworking tree差分があるときだけdocs governanceとリンク悪化を検査する。
 * errorがあればblockし、同じターンで是正させる。鮮度warningは週次workflowが通知する。
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const relevant =
  /^(?:docs\/|\.claude\/todo\/|CLAUDE\.md$|AGENTS\.md$|\.claude\/(?:config\/docs-governance\.json|rules\/docs-vs-issues\.md|skills\/management\/maintain-docs\/|scripts\/lib\/check-docs-(?:governance|links)\.cjs|hooks\/check-docs-on-stop\.js))/;

function input() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function changedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
      { cwd: projectDir, encoding: "utf8", timeout: 10_000 },
    );
    return output
      .split("\0")
      .filter(Boolean)
      .map((entry) => entry.slice(3))
      .map((entry) => entry.includes(" -> ") ? entry.split(" -> ").at(-1) : entry)
      .filter((file) => relevant.test(file));
  } catch {
    return [];
  }
}

function run(script, args) {
  try {
    const stdout = execFileSync("node", [path.join(projectDir, script), ...args], {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 90_000,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });
    return { ok: true, output: stdout };
  } catch (error) {
    // timeout は「検査できなかった」であって「文書が壊れている」ではない。
    // 区別しないと stdout/stderr が空のまま block され、原因を追えない
    // (2026-09-07: links checker が Windows で 50s かかり 30s timeout を超えて誤 block した)。
    const timedOut = error.code === "ETIMEDOUT" || error.killed === true;
    return {
      ok: false,
      timedOut,
      output: timedOut
        ? `${script} が timeout。検査は完了していないため文書の可否は未判定`
        : `${error.stdout || ""}${error.stderr || ""}`.trim(),
    };
  }
}

function main() {
  if (input().stop_hook_active) process.exit(0);
  const changed = changedFiles();
  if (changed.length === 0) process.exit(0);

  const governance = run(".claude/scripts/lib/check-docs-governance.cjs", []);
  const links = run(".claude/scripts/lib/check-docs-links.cjs", ["--baseline"]);
  if (governance.ok && links.ok) process.exit(0);

  const failed = [governance, links].filter((result) => !result.ok);
  const details = failed
    .map((result) => result.output)
    .filter(Boolean)
    .join("\n");

  // timeout しか起きていないなら是正対象が無いので block しない。
  // links checker は実測 50s〜91s と負荷で倍近く変動し (2026-09-07)、timeout を伸ばしても
  // 超える日は来る。「検査できなかった」で作業を止めるのは過剰で、文書が壊れていれば
  // 検査が完走したターンで捕まる。check-consistency-on-stop.js の
  // 「想定外エラーは通す (チェックで作業を止めない)」と設計を揃える。
  if (failed.every((result) => result.timedOut)) {
    process.stderr.write(
      `docs検査がtimeoutしたため未判定のまま続行します。手動確認: npm run docs:check\n${details}\n`,
    );
    process.exit(0);
  }

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "文書関連差分がdocs governanceを通っていません。`npm run docs:fix`、" +
        "`npm run docs:check`の順で是正してください。\n" +
        details.slice(0, 6000),
    }),
  );
}

main();
