// 検査スクリプトは、自分が置かれている作業ツリーを検査する (CI-TOOLING-FOLLOWUP-02)。
//
// 以前は .claude/scripts/lib の check-*.cjs と preflight-commit.mjs が、環境変数 CLAUDE_PROJECT_DIR を
// リポジトリのルートとして優先していた。worktree のセッションなど、その変数が別の作業ツリーを指す環境では、
// 手元の変更ではなく別の作業ツリーを検査して「通った」と報告する。
// 別のルート (テストの fixture) を検査させる口は、名前で用途が分かる STATS47_SCAN_ROOT だけにする。
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const LIB = path.join(ROOT, ".claude/scripts/lib");
const CHECKERS = fs.readdirSync(LIB).filter((name) => /^check-.*\.cjs$/.test(name)).sort();

test("check-*.cjs と preflight-commit.mjs は CLAUDE_PROJECT_DIR をルートにしない", () => {
  assert.ok(CHECKERS.length >= 30, `check-*.cjs を ${CHECKERS.length} 本しか読めていない`);
  const readers = [...CHECKERS, "preflight-commit.mjs"].filter((name) =>
    /process\.env\.CLAUDE_PROJECT_DIR|process\.env\[["']CLAUDE_PROJECT_DIR["']\]/.test(fs.readFileSync(path.join(LIB, name), "utf8")),
  );
  assert.deepEqual(readers, [], "別のルートを検査させるときは STATS47_SCAN_ROOT を使う");
});

// check-*.cjs 以外でルートを決めるスクリプトも同じ (CI-TOOLING-FOLLOWUP-03)。CLAUDE_PROJECT_DIR を優先すると、
// worktree のセッションでは別の作業ツリーの台帳へ書き、別の作業ツリーの worktree 一覧を読む
const ROOT_READERS = [
  ".claude/scripts/lib/audit-workflow-policy.cjs",
  ".claude/scripts/lib/remove-worktree.mjs",
  ".claude/scripts/lib/state-pull.mjs",
  ".claude/scripts/ads/append-ga4-affiliate-history.mjs",
  ".claude/scripts/note/audit-note-image-assets.mjs",
];

test("ルートを決める他のスクリプトも CLAUDE_PROJECT_DIR を読まず、上書きの口は STATS47_SCAN_ROOT にする", () => {
  for (const file of ROOT_READERS) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.doesNotMatch(source, /process\.env\.CLAUDE_PROJECT_DIR|process\.env\[["']CLAUDE_PROJECT_DIR["']\]/, `${file} が CLAUDE_PROJECT_DIR をルートにしている`);
    assert.match(source, /process\.env\.STATS47_SCAN_ROOT/, `${file} にルートの上書きの口 STATS47_SCAN_ROOT が無い`);
  }
});

test("CLAUDE_PROJECT_DIR が別のディレクトリを指していても自分の作業ツリーを検査し、STATS47_SCAN_ROOT を渡したときだけそこを検査する", (t) => {
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-scan-root-"));
  t.after(() => fs.rmSync(elsewhere, { recursive: true, force: true }));
  const run = (extra) => {
    const env = { ...process.env, ...extra };
    for (const name of ["CLAUDE_PROJECT_DIR", "STATS47_SCAN_ROOT"]) if (!(name in extra)) delete env[name];
    return spawnSync(process.execPath, [path.join(LIB, "check-memory-index-size.cjs")], { cwd: elsewhere, encoding: "utf8", env });
  };
  const own = run({ CLAUDE_PROJECT_DIR: elsewhere });
  assert.equal(own.status, 0, `索引の無い別のディレクトリを検査している: ${own.stderr}`);
  const explicit = run({ STATS47_SCAN_ROOT: elsewhere });
  assert.equal(explicit.status, 1, "STATS47_SCAN_ROOT で渡したルート (索引が無い) を検査していない");
  assert.match(explicit.stderr, /記憶の索引を読めない/);
});
