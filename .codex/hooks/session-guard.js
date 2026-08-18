#!/usr/bin/env node
/**
 * session-guard.js — 同一 working copy で複数 Claude セッションが同時稼働しているかを検知し、
 * SessionStart 時に警告する (git race の事前防止)。
 *
 * 背景: 2 セッションが同一 cwd で動くと .git (HEAD/index/refs/working tree) を共有し、commit 混入・
 * ブランチ ref 奪い合い・ファイル上書き (例: 2026-06-21 page.tsx 汚染) が起きる。従来 memory
 * feedback_shared_working_copy_git_race は「警告するだけで防止しない」状態だった。本フックは
 * **検知して警告する機構**を足す (①の穴埋め)。
 *
 * 仕組み: セッションごとに .claude/state/session-locks/<sessionId>.json に last_seen を記録。
 *   - SessionStart: 自分のロックを登録 + 同一 cwd の「fresh(=45分以内に活動)な他セッション」があれば警告を stdout。
 *   - Stop:        自分のロックの last_seen を更新 (稼働中の証跡)。警告は出さない (静かに refresh)。
 * cwd キー = CLAUDE_PROJECT_DIR の realpath (= working copy root)。worktree / 別 clone は path が異なるため
 * 警告対象外 = 「安全に分離された並行作業」は邪魔しない。
 *
 * 設計上の安全性: 例外を投げず常に exit 0 (フックがセッションを壊さない)。
 * 登録: .claude/settings.json hooks.SessionStart と hooks.Stop の両方。
 * 関連: memory feedback_shared_working_copy_git_race / .claude/state/session-locks/ (gitignore 済)
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOCK_DIR = path.join(ROOT, ".claude/state/session-locks");
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
function listOtherFresh(myId, key) {
  let names = [];
  try {
    names = fs.readdirSync(LOCK_DIR);
  } catch {
    return [];
  }
  const t = Date.now();
  const out = [];
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const l = readJson(path.join(LOCK_DIR, n));
    if (!l || !l.sessionId || l.sessionId === myId) continue;
    if (l.cwd !== key) continue; // 同一 working copy のみ (worktree/別clone は別 path = 安全)
    if (t - (l.lastSeen || 0) > FRESH_MS) continue; // stale は除外
    out.push(l);
  }
  return out;
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
function upsert(myId, key) {
  try {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
    const f = path.join(LOCK_DIR, safeId(myId) + ".json");
    const prev = readJson(f);
    const rec = {
      sessionId: myId,
      cwd: key,
      startedAt: prev && prev.startedAt ? prev.startedAt : new Date().toISOString(),
      lastSeen: Date.now(),
      lastSeenIso: new Date().toISOString(),
    };
    fs.writeFileSync(f, JSON.stringify(rec, null, 2) + "\n");
  } catch {}
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    input = {};
  }
  const myId = input.session_id || process.env.CLAUDE_SESSION_ID || "unknown";
  const event = input.hook_event_name || "";
  const key = cwdKey(input);

  prune();
  const others = listOtherFresh(myId, key); // upsert 前に「他」を見る
  upsert(myId, key);

  // 警告は SessionStart のみ (Stop は last_seen 更新だけ・静か)。--check で手動確認も可。
  const wantWarn = event === "SessionStart" || process.argv.includes("--check");
  if (wantWarn && others.length) {
    const o = others[0];
    const mins = Math.round((Date.now() - (o.lastSeen || 0)) / 60000);
    const lines = [
      `⚠️ 別の Claude セッションが同一 working copy で稼働中の可能性があります (git race 注意)。`,
      `   working copy: ${key}`,
      `   他セッション: ${others.length} 件 (例 ${safeId(o.sessionId).slice(0, 8)}… / 最終活動 ${mins}分前)`,
      `   → HEAD / index / working tree を共有するため commit 混入・ファイル上書きが起こりえます。`,
      `   回避: 別トピックは worktree に分離 → git worktree add ../stats47-<topic> <branch>`,
      `   commit 時は git add で明示パス指定 + 'git diff --cached --name-only' で混入チェック。`,
      `   詳細: memory feedback_shared_working_copy_git_race`,
    ];
    process.stdout.write(lines.join("\n") + "\n");
  }
  process.exit(0);
}
main();
