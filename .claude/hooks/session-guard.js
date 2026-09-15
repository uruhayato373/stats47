#!/usr/bin/env node
/**
 * session-guard.js — 同一 working copy または同一タスクで Codex / Claude セッションが同時稼働しているかを検知し、
 * SessionStart 時に警告する (git race の事前防止)。
 *
 * 背景: 2 セッションが同一 cwd で動くと .git (HEAD/index/refs/working tree) を共有し、commit 混入・
 * ブランチ ref 奪い合い・ファイル上書き (例: 2026-06-21 page.tsx 汚染) が起きる。従来 memory
 * feedback_shared_working_copy_git_race は「警告するだけで防止しない」状態だった。本フックは
 * **検知して警告する機構**を足す (①の穴埋め)。
 *
 * Git common directory の session-locks を共有し、CLIでCodexからも登録・確認・終了できる。
 * 同一作業場所または同じtaskの45分以内の活動を警告する。7日で一時メモを回収する。
 * 旧 .claude/state/session-locks も移行期間の読み取りに含める。
 * --status / --check は読み取りのみ。--register / --release は自分の記録だけを更新する。
 * 使い方・担当引継ぎ: .claude/rules/local-environment.md「Codex / Claude の作業共有」。
 * テスト: .claude/scripts/lib/__tests__/session-guard.test.cjs
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
// worktree 間でも同じ作業状況を読む。Git外のfixtureはローカルへ退避する。
function commonDirectory() {
  try {
    return execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).trim();
  } catch { return path.join(ROOT, ".claude/state"); }
}
const COMMON_DIR = commonDirectory();
const LOCK_DIR = path.join(COMMON_DIR, "session-locks");
const READ_DIRS = [...new Set([LOCK_DIR, path.join(ROOT, ".claude/state/session-locks"),
  path.join(path.dirname(COMMON_DIR), ".claude/state/session-locks")])];
function lockPath(id) {
  return path.join(LOCK_DIR, createHash("sha256").update(id).digest("hex") + ".json");
}
function records() {
  const found = new Map();
  for (const dir of READ_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const rec = readJson(path.join(dir, name));
      if (rec?.sessionId && (!found.has(rec.sessionId) || rec.lastSeen > found.get(rec.sessionId).lastSeen)) {
        found.set(rec.sessionId, rec);
      }
    }
  }
  return [...found.values()];
}
const FRESH_MS = 45 * 60 * 1000; // 45分以内に last_seen 更新があれば「稼働中」とみなす
const STALE_PRUNE_MS = 7 * 24 * 60 * 60 * 1000; // 7日超の古いロックは掃除

function readJson(f) {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}
function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}
function safeId(s) {
  return String(s || "unknown").replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 120);
}
function cwdKey(input) {
  let c = input.cwd || ROOT;
  try {
    c = fs.realpathSync(c);
  } catch {}
  return c;
}
function listOtherFresh(myId, key, task) {
  return records().filter((rec) => rec.sessionId !== myId && !rec.released &&
    Date.now() - (rec.lastSeen || 0) <= FRESH_MS &&
    (rec.cwd === key || (task && rec.task === task)));
}
function prune() {
  let names = [];
  try {
    names = fs.readdirSync(LOCK_DIR);
  } catch {
    return;
  }
  const t = Date.now();
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const f = path.join(LOCK_DIR, n);
    const l = readJson(f);
    if (l && t - (l.lastSeen || 0) > STALE_PRUNE_MS) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
  }
}
function upsert(myId, key, details = {}) {
  try {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
    const f = lockPath(myId);
    const prev = readJson(f);
    const rec = {
      ...prev,
      ...details,
      sessionId: myId,
      cwd: key,
      startedAt: prev && prev.startedAt ? prev.startedAt : new Date().toISOString(),
      lastSeen: Date.now(),
      lastSeenIso: new Date().toISOString(),
    };
    fs.writeFileSync(f, JSON.stringify(rec, null, 2) + "\n");
    return true;
  } catch { return false; }
}

function main() {
  const args = process.argv.slice(2);
  const cli = args.length > 0;
  const actions = ["--status", "--check", "--register", "--release"];
  const options = ["--session", "--task", "--agent", "--note"];
  if (cli) {
    if (args.filter((arg) => actions.includes(arg)).length !== 1) {
      console.error("--status / --check / --register / --release の1つを指定してください");
      return 1;
    }
    for (let index = 0; index < args.length; index++) {
      if (actions.includes(args[index])) continue;
      if (!options.includes(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) {
        console.error("不正な引数: " + args[index]); return 1;
      }
      index++;
    }
  }
  function value(flag) {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] && !args[index + 1].startsWith("--") ? args[index + 1] : undefined;
  }
  let input = {};
  // CLIはstdinを読まない。端末・Codexのパイプ待ちで停止しない。
  if (!cli) {
    try { input = JSON.parse(readStdin() || "{}"); } catch { input = {}; }
  }
  const myId = value("--session") || input.session_id || process.env.CODEX_THREAD_ID || process.env.CLAUDE_SESSION_ID;
  const event = input.hook_event_name || "";
  const key = cwdKey(input);
  const task = value("--task");
  if (args.includes("--status")) {
    console.log(JSON.stringify(records().map((rec) => ({ ...rec,
      active: !rec.released && Date.now() - (rec.lastSeen || 0) <= FRESH_MS })), null, 2));
    return 0;
  }
  if (args.includes("--register") || args.includes("--release")) {
    if (!myId) { console.error("--session または CODEX_THREAD_ID / CLAUDE_SESSION_ID が必要です"); return 1; }
  }
  const others = listOtherFresh(myId, key, task);
  const write = !cli || args.includes("--register") || args.includes("--release");
  if (write && myId) {
    prune();
    const details = {};
    if (value("--agent")) details.agent = value("--agent");
    else if (process.env.CODEX_THREAD_ID) details.agent = "codex";
    if (task) details.task = task;
    if (value("--note")) details.note = value("--note");
    if (args.includes("--release")) details.released = true;
    else if (event === "SessionStart" || args.includes("--register")) details.released = false;
    if (!upsert(myId, key, details) && cli) { console.error("作業状況を保存できませんでした"); return 1; }
  }
  const wantWarn = event === "SessionStart" || args.includes("--check") || args.includes("--register");
  if (wantWarn && others.length) {
    console.log("⚠️ Codex / Claude の作業が重複する可能性があります。担当と作業場所を確認してください。");
    for (const rec of others) {
      console.log(JSON.stringify({ session: safeId(rec.sessionId), agent: rec.agent || "claude",
        task: rec.task || null, cwd: rec.cwd, note: rec.note || null, lastSeenIso: rec.lastSeenIso }));
    }
  }
  // hookは警告のみ。明示checkの呼び元は重複をexit codeで扱える。
  return cli && wantWarn && others.length ? 1 : 0;
}
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error.message); process.exitCode = process.argv.length > 2 ? 1 : 0; }
}
