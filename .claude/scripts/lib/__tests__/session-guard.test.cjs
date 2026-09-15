const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT = path.resolve(__dirname, "../../../hooks/session-guard.js");
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-session-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function run(root, args = [], input = {}, env = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: "utf8",
    input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: root,
      CODEX_THREAD_ID: "", CLAUDE_SESSION_ID: "", ...env } });
}
test("Codex登録をClaude hookが検知し、終了後は衝突扱いしない", (t) => {
  const root = fixture(t);
  const registered = run(root, ["--register", "--task", "TASK-1", "--agent", "codex"], {}, { CODEX_THREAD_ID: "codex-1" });
  assert.equal(registered.status, 0, registered.stderr);
  const hook = run(root, [], { session_id: "claude-1", hook_event_name: "SessionStart", cwd: root });
  assert.equal(hook.status, 0, "hookは既存動作を維持する");
  assert.match(hook.stdout, /codex-1/);
  assert.equal(run(root, ["--check", "--session", "claude-1"]).status, 1);
  assert.equal(run(root, ["--release", "--session", "codex-1", "--note", "targeted tests passed"]).status, 0);
  assert.equal(run(root, ["--check", "--session", "claude-1"]).status, 0);
  const status = JSON.parse(run(root, ["--status"]).stdout);
  assert.equal(status.find((r) => r.sessionId === "codex-1").note, "targeted tests passed");
});
test("IDなしの確認はunknownを登録せず、登録要求は失敗する", (t) => {
  const root = fixture(t);
  assert.equal(run(root, ["--check"]).status, 0);
  assert.equal(run(root, ["--register"]).status, 1);
  assert.equal(run(root, ["codex", "stripped-flags"]).status, 1);
  assert.equal(run(root, ["--register", "--session"]).status, 1);
  assert.deepEqual(JSON.parse(run(root, ["--status"]).stdout), []);
});
test("異なるworktreeでも同じタスクを検知し、別タスクの並行作業は許す", (t) => {
  const root = fixture(t);
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  git("init");
  git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "--allow-empty", "-m", "fixture");
  const other = path.join(root, "other");
  git("worktree", "add", "--detach", other);
  assert.equal(run(root, ["--register", "--session", "a", "--task", "TASK-1"]).status, 0);
  assert.equal(run(other, ["--check", "--session", "b", "--task", "TASK-1"]).status, 1);
  assert.equal(run(other, ["--check", "--session", "b", "--task", "TASK-2"]).status, 0);
  assert.equal(JSON.parse(run(other, ["--status"]).stdout)[0].task, "TASK-1");
});
