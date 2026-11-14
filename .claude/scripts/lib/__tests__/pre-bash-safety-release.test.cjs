const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

/** 守る意図: オーナーの指示なしに main 宛ての PR を開いたりマージしたりできない。指示があるときの通り道は残す */
const HOOK = path.resolve(__dirname, "../../../hooks/pre-bash-safety.js");
const denied = (command) => {
  const { stdout } = spawnSync("node", [HOOK], { input: JSON.stringify({ tool_input: { command } }), encoding: "utf8" });
  return stdout.includes('"permissionDecision":"deny"');
};

test("main 宛ての PR の作成を止める", () => {
  assert.equal(denied('gh pr create --base main --head develop --title "x"'), true);
  assert.equal(denied("git push origin develop && gh pr create --head develop --base=main"), true);
});

test("PR のマージを止める", () => {
  assert.equal(denied("gh pr merge 1244 --merge"), true);
  assert.equal(denied("cd repo && gh pr merge 1244 --auto"), true);
});

test("オーナーの指示を明示したコマンドは通す", () => {
  assert.equal(denied('OWNER_APPROVED_RELEASE=1 gh pr create --base main --head develop --title "x"'), false);
  assert.equal(denied("OWNER_APPROVED_RELEASE=1 gh pr merge 1244 --merge"), false);
});

test("git add -A / --all / . は止め、ファイルを名指しした git add は後ろのコマンドの -A で止めない", () => {
  for (const command of ["git add -A", "git add --all", "git add .", "git add foo.txt -A", "cd repo && git add .", "git add a.txt; git add -A"]) {
    assert.equal(denied(command), true, command);
  }
  // 区切り (&& ; |) の向こうの -A は別のコマンドの引数 (CI-TOOLING-FOLLOWUP-03)
  for (const command of [
    "git add a.txt && git diff --cached | grep -A 30 foo",
    "git add a.txt b.txt; grep -A 3 x y",
    "git add a.txt | cat -A",
    "git add ./a.txt",
  ]) {
    assert.equal(denied(command), false, command);
  }
});

test("読み取りと develop 宛ての PR は止めない", () => {
  assert.equal(denied("gh pr view 1244"), false);
  assert.equal(denied("gh pr list --base main"), false);
  assert.equal(denied("gh pr create --draft --base develop --head x"), false);
});
