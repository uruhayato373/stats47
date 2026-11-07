import assert from "node:assert/strict";
import { test } from "node:test";

import { changedPaths, needsDeploy, needsMetricMetadata } from "../plan-deploy-scope.mjs";

/**
 * 守る意図: 本番に関係しない push のデプロイを省くが、判断できないときは必ずデプロイする。
 * 省きすぎて本番へ出ない事故のほうが、余分なデプロイより害が大きい。
 */
test("運用文書・管理画面・計測の記録だけの push はデプロイしない", () => {
  assert.equal(needsDeploy([".claude/rules/a.md", "docs/a.md", "apps/admin/lib/a.ts", "data/gsc/snapshots/2026-W43/pages.csv", "data/sns/posts.json"]), false);
});

test("サイトのコード・指標・未知のパスが 1 件でもあればデプロイする", () => {
  for (const path of ["apps/web/src/a.ts", "data/metrics/a.ts", "data/content/pages/blog.json", "packages/ranking/src/a.ts", "package.json", "package-lock.json", "config/datasets.mjs", ".github/workflows/deploy-workers.yml", "new-dir/a"]) {
    assert.equal(needsDeploy(["docs/a.md", path]), true, path);
  }
});

test("差分が空ならデプロイする (判断の材料が無い)", () => {
  assert.equal(needsDeploy([]), true);
});

test("差分を読めないときは null を返し、呼び元はデプロイする", () => {
  const fail = () => { throw new Error("no commit"); };
  assert.equal(changedPaths("abc", "def", fail), null);
  assert.equal(changedPaths("0000000000", "def", () => "a"), null);
  assert.equal(changedPaths("", "def", () => "a"), null);
  assert.deepEqual(changedPaths("abc", "def", () => "a\0b\0"), ["a", "b"]);
});

test("画面だけの変更は指標の生成を省き、指標の入力の変更では生成する", () => {
  assert.equal(needsMetricMetadata(["apps/web/src/features/a.tsx", "packages/components/src/a.tsx", "docs/a.md"]), false);
  for (const path of ["data/metrics/a.ts", "data/themes/catalogs/a.json", "packages/ranking/src/a.ts", "packages/data-configs/src/a.ts", "package-lock.json", "apps/web/scripts/a.ts"]) {
    assert.equal(needsMetricMetadata([path]), true, path);
  }
});
