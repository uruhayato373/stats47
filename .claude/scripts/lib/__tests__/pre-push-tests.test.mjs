import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { DOMAINS } from "../../../../config/paths.mjs";

import { needsDocsCheck, selectNodeTests, selectVitestSources } from "../pre-push-tests.mjs";

/** 守る意図: 2026-11-06 に data/business/domains.json を変えて check-domains のテストを走らせず、PR の CI で 12 分待った失敗を push 前に止める */
const tests = [".claude/scripts/lib/__tests__/check-domains.test.cjs", ".claude/scripts/lib/__tests__/check-datasets.test.mjs", ".claude/scripts/lib/__tests__/sns-posts-store.test.cjs"];

test("設定ファイルの変更から、名前の重なるテストを選ぶ", () => {
  assert.deepEqual(selectNodeTests([DOMAINS], tests), [tests[0]]);
});

test("スクリプトの変更から、同じ名前のテストを選ぶ", () => {
  assert.deepEqual(selectNodeTests([".claude/scripts/lib/sns-posts-store.cjs"], tests), [tests[2]]);
});

test("変更したテスト自身を選ぶ", () => {
  assert.deepEqual(selectNodeTests([tests[1]], tests), [tests[1]]);
});

test("短い名前の変更では広く当てない", () => {
  assert.deepEqual(selectNodeTests(["apps/web/src/a.ts", "docs/INDEX.md"], tests), []);
});

test("vitest には workspace の TypeScript だけを相対パスで渡す", () => {
  assert.deepEqual(selectVitestSources(["apps/admin/lib/a.ts", "apps/admin/README.md", "apps/web/src/b.tsx"], "apps/admin"), ["lib/a.ts"]);
});

/**
 * 守る意図: 2026-10-21 に pre-commit を通らず develop に入った backlog の語彙外カテゴリ (DG057) が、リリース PR の CI を止めた。
 * commit 側の hook を飛ばした変更も、push の前に docs:check で止める。対象の範囲は pre-commit (pre-commit-checks.sh の STAGED_DOCS) と同じ。
 */
test("文書ガバナンスの対象 (.claude/todo・docs・ドメイン台帳など) の変更なら docs:check を要求する", () => {
  for (const path of [".claude/todo/backlog.md", "docs/INDEX.md", "data/business/domains.json", "data/business/domain-stances.json", "CLAUDE.md", ".claude/config/docs-governance.json", ".claude/scripts/lib/check-docs-governance.cjs", "package.json"]) {
    assert.equal(needsDocsCheck([path]), true, path);
  }
});

test("文書と無関係な変更では docs:check を要求しない", () => {
  assert.equal(needsDocsCheck(["apps/web/src/a.ts", "data/metrics/foo.ts", "apps/web/package.json", "packages/x/docs/a.md"]), false);
  assert.equal(needsDocsCheck([]), false);
});

/**
 * 守る意図: core.hooksPath は本体の絶対パスなので、本体の .husky/pre-push が他の worktree の push でも動く。
 * スクリプトを持たない古いブランチの worktree の push が MODULE_NOT_FOUND で止まった (2026-11-07) のを繰り返さない。
 */
const HOOK = fileURLToPath(new URL("../../../../.husky/pre-push", import.meta.url));
const SCRIPT = ".claude/scripts/lib/pre-push-tests.mjs";
const noShell = process.platform === "win32";

function runHookIn(setup) {
  const dir = mkdtempSync(join(tmpdir(), "pre-push-hook-"));
  try {
    setup(dir);
    return spawnSync("sh", [HOOK], { cwd: dir, encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeScript(dir, exitCode) {
  mkdirSync(join(dir, dirname(SCRIPT)), { recursive: true });
  writeFileSync(join(dir, SCRIPT), `process.exit(${exitCode});\n`);
}

test("push する作業ツリーにスクリプトが無ければ、フックは何もせず通す", { skip: noShell }, () => {
  const result = runHookIn(() => {});
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /MODULE_NOT_FOUND/);
});

test("スクリプトがあってテストが落ちれば、フックは push を止める", { skip: noShell }, () => {
  assert.equal(runHookIn((dir) => writeScript(dir, 1)).status, 1);
});

test("スクリプトがあってテストが通れば、フックは通す", { skip: noShell }, () => {
  assert.equal(runHookIn((dir) => writeScript(dir, 0)).status, 0);
});

/** 一時リポジトリで pre-push-tests.mjs を実際に走らせ、backlog の変更を push する状況を作る。docs:check は終了コードを指定した代役にする */
function runPrePushWithBacklogChange(docsCheckExit) {
  const dir = mkdtempSync(join(tmpdir(), "pre-push-docs-"));
  try {
    const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "core.hooksPath=/dev/null", ...args], { cwd: dir, encoding: "utf8" });
    mkdirSync(join(dir, dirname(SCRIPT)), { recursive: true });
    mkdirSync(join(dir, ".claude/todo"), { recursive: true });
    copyFileSync(fileURLToPath(new URL("../pre-push-tests.mjs", import.meta.url)), join(dir, SCRIPT));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { "docs:check": `node -e "process.exit(${docsCheckExit})"` } }));
    writeFileSync(join(dir, ".claude/todo/backlog.md"), "### [A-01] a\n");
    git("init", "-q");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("update-ref", "refs/remotes/origin/develop", "HEAD");
    writeFileSync(join(dir, ".claude/todo/backlog.md"), "### [A-01] a\nタグ: [戦略]\n");
    git("commit", "-q", "-am", "change backlog");
    return spawnSync("node", [SCRIPT], { cwd: dir, encoding: "utf8", env: { ...process.env, CI: "" } });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("backlog の変更を push するとき、docs:check が落ちれば push を止める", { skip: noShell }, () => {
  const result = runPrePushWithBacklogChange(1);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /docs:check/);
});

test("backlog の変更を push するとき、docs:check が通れば通す", { skip: noShell }, () => {
  const result = runPrePushWithBacklogChange(0);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("hook から起動するテストに GIT_ で始まる環境変数を渡さない (本物の .git/config を書き換えないため)", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "pre-push-tests.mjs"), "utf8");
  const run = source.slice(source.indexOf("function run("), source.indexOf("\n}\n", source.indexOf("function run(")));
  assert.match(run, /startsWith\("GIT_"\)/, "GIT_ の変数を取り除く処理が run() に無い");
  assert.match(run, /spawnSync\(command, args, \{[^}]*\benv\b/, "取り除いた env を spawnSync に渡していない");
});
