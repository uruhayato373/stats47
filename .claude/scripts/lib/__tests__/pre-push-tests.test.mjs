import assert from "node:assert/strict";
import { test } from "node:test";

import { selectNodeTests, selectVitestSources } from "../pre-push-tests.mjs";

/** 守る意図: 2026-11-06 に config/domains.json を変えて check-domains のテストを走らせず、PR の CI で 12 分待った失敗を push 前に止める */
const tests = [".claude/scripts/lib/__tests__/check-domains.test.cjs", ".claude/scripts/lib/__tests__/check-datasets.test.mjs", ".claude/scripts/lib/__tests__/sns-posts-store.test.cjs"];

test("設定ファイルの変更から、名前の重なるテストを選ぶ", () => {
  assert.deepEqual(selectNodeTests([["config", "domains.json"].join("/")], tests), [tests[0]]);
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
