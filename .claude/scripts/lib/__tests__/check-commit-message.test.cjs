const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-commit-message.cjs");
const { inspectCommitMessage } = require(CHECKER);

function runOn(message) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-commitmsg-"));
  const file = path.join(dir, "COMMIT_EDITMSG");
  fs.writeFileSync(file, message);
  const result = spawnSync(process.execPath, [CHECKER, file], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

test("通常の commit メッセージは通す", () => {
  const result = runOn("feat(theme): 指標カードを複数チェック対応にする\n\n本文。\n");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("[mutation] 件名の skip トークンを拒否する (2026-08-20 に実際に踏んだ形)", () => {
  const result = runOn("docs: 根拠のない実測値と [skip ci] の主張を是正\n");
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /CI skip トークン/);
});

test("[mutation] 本文中の skip トークンも拒否する (件名だけの問題ではない)", () => {
  const result = runOn("docs: 説明\n\nCI が走らない条件として [ci skip] がある。\n");
  assert.equal(result.status, 1, result.stdout + result.stderr);
});

test("表記ゆれ (skip actions / ***NO_CI*** / アンダースコア) も拾う", () => {
  for (const token of ["[skip actions]", "***NO_CI***", "[skip_ci]", "[NO CI]"]) {
    const result = runOn(`docs: ${token} を含む件名\n`);
    assert.equal(result.status, 1, `${token} が拾えていない: ${result.stdout}${result.stderr}`);
  }
});

test("ALLOW-SKIP-CI 宣言があれば通す (意図的な skip の逃げ道)", () => {
  const result = runOn("chore(state): 週次 snapshot を反映 [skip ci]\n\nALLOW-SKIP-CI: 生成物のみで検査対象の変更が無いため\n");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /許可しました/);
});

test("ALLOW-SKIP-CI に理由が無ければ許可しない (空宣言でのすり抜けを防ぐ)", () => {
  const result = runOn("chore: 何か [skip ci]\n\nALLOW-SKIP-CI:\n");
  assert.equal(result.status, 1, result.stdout + result.stderr);
});

test("git のコメント行 (#) は判定対象外 (テンプレートの説明文で誤爆しない)", () => {
  const result = runOn("feat: 通常の件名\n\n# 例: [skip ci] と書くと CI が止まります\n");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("別表記 (skip-ci / ci-skip) は通す — 文書内で言及する正しい書き方", () => {
  const result = runOn("docs(rules): skip-ci トークンの扱いを追記\n\nci-skip も同様。\n");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("純関数 inspectCommitMessage が matched を返す (呼び出し側で再利用できる)", () => {
  const { ok, matched } = inspectCommitMessage("docs: [skip ci] の話\n");
  assert.equal(ok, false);
  assert.deepEqual(matched, ["[skip ci]"]);
});
