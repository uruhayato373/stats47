#!/usr/bin/env node
/**
 * Stop hook: このセッションが作って push していない commit があれば、終える前に 1 回だけ差し戻す
 * (UNPUSHED-COMMIT-STOP-01)。
 *
 * 2026-10-10、別のセッションが develop へ commit したまま push せずに離れ、origin/develop の
 * Develop Quality Gate が落ち続けた。他の Stop hook はローカルが origin より先にある状態を見ていなかった。
 *
 * low-noise 設計:
 *   - 数えるのは今のブランチの upstream より先にある commit のうち、自分の author (git config user.email) で、
 *     セッションの開始時刻 (会話記録の最初の timestamp) 以降に作ったものだけ。他のセッションの commit では止めない。
 *   - 同じ HEAD では 1 回だけ (`.claude/state/session-locks/` に記録)。push すれば対象が無くなって黙る。
 *   - fetch はしない (hook を遅くしない)。upstream が無い・会話記録が読めないときは黙る。
 *   - stop_hook_active なら無限ループ防止で即終了。
 *
 * 出力: 対象があれば JSON { decision:"block", reason } を stdout。Stop hook は exit 0 必須。
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SCAN_LINES = 50;

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).trim();
}

/** 会話記録 (JSONL) の最初の timestamp をセッションの開始時刻とする。読めなければ null */
function sessionStartedAt(transcriptPath) {
  if (!transcriptPath) return null;
  try {
    const head = fs.readFileSync(transcriptPath, "utf8").split("\n").slice(0, SCAN_LINES);
    for (const line of head) {
      try {
        const ts = JSON.parse(line).timestamp;
        if (ts && !Number.isNaN(Date.parse(ts))) return new Date(ts);
      } catch {
        /* 壊れた行は飛ばす */
      }
    }
  } catch {
    /* 読めなければ判定しない */
  }
  return null;
}

/** upstream より先にある、自分が startedAt 以降に作った commit を返す (新しい順) */
function unpushedOwnCommits(cwd, startedAt) {
  let upstream;
  try {
    upstream = git(cwd, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  } catch {
    return { upstream: null, commits: [] };
  }
  const email = git(cwd, ["config", "user.email"]);
  const out = git(cwd, ["log", "--format=%H%x09%ae%x09%aI%x09%s", `${upstream}..HEAD`]);
  const commits = out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, author, date, subject] = line.split("\t");
      return { sha, author, date: new Date(date), subject };
    })
    .filter((c) => c.author === email && c.date >= startedAt);
  return { upstream, commits };
}

function main() {
  const input = readStdin();
  if (input.stop_hook_active) return;
  const cwd = input.cwd || PROJECT_ROOT;
  const startedAt = sessionStartedAt(input.transcript_path);
  if (!startedAt) return;

  let result;
  try {
    result = unpushedOwnCommits(cwd, startedAt);
  } catch {
    return; // git が使えなければ止めない
  }
  if (!result.upstream || result.commits.length === 0) return;

  const head = result.commits[0].sha;
  const lockDir = path.join(cwd, ".claude", "state", "session-locks");
  const lockFile = path.join(lockDir, `unpushed-${String(input.session_id || "unknown").replace(/[^\w.-]/g, "_")}.txt`);
  try {
    if (fs.existsSync(lockFile) && fs.readFileSync(lockFile, "utf8").trim() === head) return;
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(lockFile, `${head}\n`);
  } catch {
    /* 記録できなくても知らせる */
  }

  const list = result.commits.slice(0, 5).map((c) => `  - ${c.sha.slice(0, 9)} ${c.subject}`).join("\n");
  const more = result.commits.length > 5 ? `\n  - ほか ${result.commits.length - 5} 件` : "";
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        `このセッションが作った commit ${result.commits.length} 件が ${result.upstream} へ push されていません:\n${list}${more}\n` +
        "push するか、push しない理由 (例: ユーザーが push を止めた) を返答に書いてください。同じ状態では再び止めません。",
    }),
  );
}

if (require.main === module) {
  try {
    main();
  } catch {
    /* Stop hook は失敗しても会話を止めない */
  }
  process.exit(0);
}

module.exports = { sessionStartedAt, unpushedOwnCommits };
