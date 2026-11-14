// core.hooksPath は本体の .husky を絶対パスで指すので、worktree の commit でも本体の .husky/pre-commit が走る。
// 作業ツリー側で .husky/pre-commit を変えても commit では本体の版が走り、変更が効かない (CI-TOOLING-FOLLOWUP-03)。
// 本体の hook は、commit する作業ツリーの .husky/pre-commit が自分と違えば、そちらを走らせる。
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const HOOK = path.join(ROOT, ".husky", "pre-commit");

/** 本体の .husky (hooksPath の指す先) と、commit する作業ツリーを作る */
function fixture(t, ownHook) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-husky-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const mainHusky = path.join(base, "main", ".husky");
  fs.mkdirSync(mainHusky, { recursive: true });
  fs.copyFileSync(HOOK, path.join(mainHusky, "pre-commit"));
  const worktree = path.join(base, "worktree");
  fs.mkdirSync(path.join(worktree, ".husky"), { recursive: true });
  fs.mkdirSync(path.join(worktree, "apps", "web", "scripts"), { recursive: true });
  // 本体の hook の本文が走ったことを示す印 (本文の最初の検査が呼ぶスクリプト)
  fs.writeFileSync(path.join(worktree, "apps", "web", "scripts", "pre-commit-checks.sh"), "echo MAIN-BODY\nexit 1\n");
  if (ownHook !== null) fs.writeFileSync(path.join(worktree, ".husky", "pre-commit"), ownHook);
  execFileSync("git", ["init", "-q"], { cwd: worktree });
  return { hook: path.join(mainHusky, "pre-commit"), worktree };
}

function run(hook, cwd) {
  const result = spawnSync("sh", [hook], { cwd, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

test("作業ツリーの .husky/pre-commit が本体の版と違えば、作業ツリーの版を走らせる", (t) => {
  const { hook, worktree } = fixture(t, "#!/bin/sh\necho OWN-HOOK\nexit 0\n");
  const result = run(hook, worktree);
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /OWN-HOOK/);
  assert.doesNotMatch(result.output, /MAIN-BODY/);
});

test("作業ツリーの版が本体と同じなら、委ねずにそのまま本文を走らせる (無限に委ねない)", (t) => {
  const { hook, worktree } = fixture(t, fs.readFileSync(HOOK, "utf8"));
  const result = run(hook, worktree);
  assert.equal(result.status, 1, result.output);
  assert.equal(result.output.match(/MAIN-BODY/g)?.length, 1, result.output);
});

test("作業ツリーに .husky/pre-commit が無ければ、本体の本文を走らせる", (t) => {
  const { hook, worktree } = fixture(t, null);
  const result = run(hook, worktree);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /MAIN-BODY/);
});
