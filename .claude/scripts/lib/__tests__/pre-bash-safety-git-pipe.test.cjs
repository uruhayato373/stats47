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

/**
 * 守る意図 (HOOK-BASH-ADVISORY-NOISE-01): advisory は実行するコマンドの先頭に当たったときだけ出し、
 * パスや文字列にだけ語を含むコマンドでは出さない。同じ advisory は 1 会話 1 回。
 */
const fs = require("node:fs");
const os = require("node:os");

/** 会話の記録は os.tmpdir() に session_id ごとに書かれるので、テストごとに一意の session_id を使い、終わったら消す。 */
const RUN = `${process.pid}-${Date.now()}`;
const stateFile = (sessionId) => path.join(os.tmpdir(), `stats47-bash-advisory-${sessionId}.json`);
const advisoryIds = (command, sessionId) => {
  const { stdout } = spawnSync("node", [HOOK], {
    input: JSON.stringify({ session_id: sessionId, tool_input: { command } }),
    encoding: "utf8",
  });
  if (!stdout.trim()) return [];
  const context = JSON.parse(stdout).hookSpecificOutput?.additionalContext ?? "";
  return ["branch-workflow", "r2-storage-design", "sns-content-standards"].filter((id) => context.includes(`[${id}]`));
};
const withSessions = (t, names) => {
  const ids = names.map((name) => `${name}-${RUN}`);
  t.after(() => ids.forEach((id) => fs.rmSync(stateFile(id), { force: true })));
  return ids;
};

test("文字列・パス・heredoc にだけ語を含むコマンドでは advisory を出さない", (t) => {
  const quiet = [
    'git commit -m "docs: git push と publish-x と diff-push-r2 の説明"',
    "git add .claude/scripts/sns/publish-x.ts packages/r2-storage/src/scripts/diff-push-r2.ts",
    "grep -rn publish-x .claude/skills",
    "cat .claude/rules/branch-workflow.md | grep 'git push'",
    "node --test .claude/scripts/sns/publish-x.test.cjs",
    "cat > /tmp/x.md <<'EOF'\ngit push origin develop\nnode scripts/publish-x.ts\nEOF",
    "echo wrangler r2 object put",
  ];
  const quietIds = withSessions(t, quiet.map((_, index) => `quiet-${index}`));
  quiet.forEach((command, index) => assert.deepEqual(advisoryIds(command, quietIds[index]), [], command));
});

test("実際の push・R2 の書き込み・SNS 投稿では advisory を出す", (t) => {
  const [s1, s2, s3, s4, s5, s6] = withSessions(t, ["hit-1", "hit-2", "hit-3", "hit-4", "hit-5", "hit-6"]);
  assert.deepEqual(advisoryIds("git push origin develop", s1), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("cd repo && git -C ../wt push -u origin feat/x > /tmp/p.log 2>&1", s2), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("gh pr create --base develop --title x", s3), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --dry-run", s4), ["r2-storage-design"]);
  assert.deepEqual(advisoryIds("wrangler r2 object put bucket/key --file x", s5), ["r2-storage-design"]);
  assert.deepEqual(advisoryIds("FOO=1 node .claude/scripts/sns/publish-x.ts --from-queue", s6), ["sns-content-standards"]);
});

test("同じ advisory は 1 会話に 1 回だけ。別の会話・別の advisory・session_id なしでは出す", (t) => {
  const [same, other] = withSessions(t, ["same", "other"]);
  assert.deepEqual(advisoryIds("git push origin develop", same), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("git push origin develop", same), []);
  assert.deepEqual(advisoryIds("npx tsx scripts/diff-push-r2.ts", same), ["r2-storage-design"]);
  assert.deepEqual(advisoryIds("git push origin develop", other), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("git push origin develop", undefined), ["branch-workflow"]);
  assert.deepEqual(advisoryIds("git push origin develop", undefined), ["branch-workflow"]);
});
