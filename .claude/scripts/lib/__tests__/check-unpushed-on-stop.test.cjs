/**
 * check-unpushed-on-stop (Stop hook) の境界を固定する。
 * 実行: node --test .claude/scripts/lib/__tests__/check-unpushed-on-stop.test.cjs
 *
 * ★自分が作った未 push の commit で 1 回だけ止める (感度) と、push 後・2 回目・他人の commit・
 *   セッション開始前の commit では止めない (誤検知なし) の両方向を見る。
 */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const HOOK = path.resolve(__dirname, "../../../hooks/check-unpushed-on-stop.js");

function sh(cwd, args, env = {}) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-unpushed-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const remote = path.join(base, "remote.git");
  const repo = path.join(base, "repo");
  sh(base, ["init", "--bare", "-b", "develop", remote]);
  sh(base, ["clone", remote, repo]);
  sh(repo, ["config", "user.email", "me@example.invalid"]);
  sh(repo, ["config", "user.name", "Me"]);
  sh(repo, ["config", "core.hooksPath", "/dev/null"]);
  sh(repo, ["checkout", "-b", "develop"]);
  sh(repo, ["commit", "--allow-empty", "-m", "base", "--date", "2026-10-01T00:00:00Z"], { GIT_COMMITTER_DATE: "2026-10-01T00:00:00Z" });
  sh(repo, ["push", "-u", "origin", "develop"]);
  const transcript = path.join(base, "t.jsonl");
  fs.writeFileSync(transcript, `${JSON.stringify({ type: "queue-operation", timestamp: "2026-10-26T00:00:00.000Z" })}\n`);
  const commit = (msg, date, env = {}) =>
    sh(repo, ["commit", "--allow-empty", "-m", msg, "--date", date], { GIT_COMMITTER_DATE: date, ...env });
  // 実行環境の CLAUDE_PROJECT_DIR を引き継がない (環境変数なしの経路を固定するため)
  const run = (cwd = repo, env = {}) => {
    const childEnv = { ...process.env, ...env };
    if (!("CLAUDE_PROJECT_DIR" in env)) delete childEnv.CLAUDE_PROJECT_DIR;
    return spawnSync(process.execPath, [HOOK], {
      encoding: "utf8",
      env: childEnv,
      input: JSON.stringify({ session_id: "s1", cwd, transcript_path: transcript }),
    }).stdout;
  };
  return { repo, commit, run };
}

test("自分がセッション中に作った未 push の commit で 1 回だけ止め、push 後は黙る", (t) => {
  const { repo, commit, run } = fixture(t);
  commit("mine", "2026-10-26T01:00:00Z");
  const first = run();
  assert.match(first, /"decision":"block"/);
  assert.match(first, /mine/);
  assert.equal(run(), "", "同じ HEAD では 2 回目は止めない");
  sh(repo, ["push"]);
  assert.equal(run(), "", "push 後は止めない");
});

test("他人の commit とセッション開始前の commit では止めない", (t) => {
  const { commit, run } = fixture(t);
  commit("before session", "2026-10-25T23:00:00Z");
  commit("someone else", "2026-10-26T02:00:00Z", { GIT_AUTHOR_EMAIL: "other@example.invalid" });
  assert.equal(run(), "");
});

test("新しく commit が増えたら改めて 1 回止める", (t) => {
  const { commit, run } = fixture(t);
  commit("first", "2026-10-26T01:00:00Z");
  assert.match(run(), /"decision":"block"/);
  commit("second", "2026-10-26T02:00:00Z");
  assert.match(run(), /second/);
});

test("作業場所が下位ディレクトリでも、記録はリポジトリ直下の .claude/state/session-locks/ にだけ書く", (t) => {
  const { repo, commit, run } = fixture(t);
  const sub = path.join(repo, "apps", "web");
  fs.mkdirSync(sub, { recursive: true });
  commit("mine", "2026-10-26T01:00:00Z");
  assert.match(run(sub), /"decision":"block"/);
  assert.equal(fs.existsSync(path.join(sub, ".claude")), false, "下位ディレクトリに .claude を作らない");
  assert.equal(fs.existsSync(path.join(repo, ".claude", "state", "session-locks", "unpushed-s1.txt")), true);
  assert.equal(run(sub), "", "作業場所が変わっても同じ HEAD では 2 回目は止めない");
  assert.equal(run(repo), "", "リポジトリ直下から見ても同じ記録を共有する");
});

test("CLAUDE_PROJECT_DIR があればそれを記録の基準にする", (t) => {
  const { repo, commit, run } = fixture(t);
  const sub = path.join(repo, "apps", "web");
  fs.mkdirSync(sub, { recursive: true });
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-unpushed-proj-"));
  t.after(() => fs.rmSync(projectDir, { recursive: true, force: true }));
  commit("mine", "2026-10-26T01:00:00Z");
  assert.match(run(sub, { CLAUDE_PROJECT_DIR: projectDir }), /"decision":"block"/);
  assert.equal(fs.existsSync(path.join(projectDir, ".claude", "state", "session-locks", "unpushed-s1.txt")), true);
  assert.equal(fs.existsSync(path.join(sub, ".claude")), false);
});
