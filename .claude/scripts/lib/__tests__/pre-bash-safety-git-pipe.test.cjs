const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

/**
 * 守る意図: git commit / push の出力をパイプに流すと、成否が最終段の exit に化けて隠れる
 * (memory feedback-exit-code-not-via-pipe)。ファイルに書く形は通す。
 */
const HOOK = path.resolve(__dirname, "../../../hooks/pre-bash-safety.js");
const denied = (command) => {
  const { stdout } = spawnSync("node", [HOOK], { input: JSON.stringify({ tool_input: { command } }), encoding: "utf8" });
  return stdout.includes('"permissionDecision":"deny"');
};

test("git push / commit の出力をパイプに流す形を止める", () => {
  assert.equal(denied("git push -u origin feat/x 2>&1 | tail -4"), true);
  assert.equal(denied("cd repo && git push origin feat/x | head"), true);
  assert.equal(denied("git -C ../wt commit -q -m done 2>&1 | tail -3"), true);
});

test("ファイルに書く形・|| での分岐・ほかの git コマンドのパイプは止めない", () => {
  assert.equal(denied("git push -u origin feat/x > /tmp/push.log 2>&1; echo \"EXIT=$?\""), false);
  assert.equal(denied("git push origin feat/x || echo failed"), false);
  assert.equal(denied("git log --oneline | head -5"), false);
  assert.equal(denied("git diff --cached --name-only | wc -l"), false);
});
