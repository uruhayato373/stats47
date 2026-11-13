import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { DOMAINS } from "../../../../config/paths.mjs";

import { selectNodeTests, selectVitestSources } from "../pre-push-tests.mjs";

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
