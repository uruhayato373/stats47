import assert from "node:assert/strict";
import { test } from "node:test";

import { changedMetricKeys, metricKeysFromPaths } from "../plan-metric-ingest.mjs";

/**
 * 守る意図: 変えた指標だけを取り込みに渡す。指標でないファイル (極性の表・形の例外の台帳など) を
 * 指標として渡すと page-data-batch が「registry に無い key」で止まり、デプロイの後の取り込みが毎回落ちる。
 * 取りこぼすと、設定を変えた指標の値が本番に入らないまま残る (2026-11-23 に医療施設の 6 指標で起きた)。
 */
test("data/metrics の直下の 1 ファイルを 1 指標として取り出す", () => {
  assert.deepEqual(
    metricKeysFromPaths(["data/metrics/general-hospital-count.ts", "data/metrics/dental-clinic-count.ts", "data/metrics/general-hospital-count.ts"]),
    ["dental-clinic-count", "general-hospital-count"],
  );
});

test("下の階層・別の拡張子・別の置き場は指標として扱わない", () => {
  assert.deepEqual(
    metricKeysFromPaths([
      "data/metrics/policy/polarity.ts",
      "data/metrics/quality/shape-exceptions.ts",
      "data/metrics/README.md",
      "data/metrics/schema.json",
      "packages/data-configs/src/metrics/a.ts",
      "data/metrics-old/a.ts",
      "",
    ]),
    [],
  );
});

test("main に入った差分は base..head で比べ、消した指標は渡さない", () => {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return "data/metrics/a.ts\ndata/metrics/policy/polarity.ts\n";
  };
  assert.deepEqual(changedMetricKeys({ base: "abc", head: "def", git }), ["a"]);
  assert.deepEqual(calls, [["diff", "--name-only", "--diff-filter=AMR", "abc", "def", "--", "data/metrics"]]);
});

test("base が無い・0 の SHA (見張り役の起動・最初の push) なら head の親と比べる", () => {
  for (const base of [undefined, "", "0000000000000000000000000000000000000000"]) {
    const calls = [];
    changedMetricKeys({ base, head: "def", git: (args) => (calls.push(args), "") });
    assert.equal(calls[0][3], "def~1", String(base));
  }
});

test("手元と比べるときは未追跡の新しい指標も拾い、作業ツリーに無い key は外す", () => {
  const git = (args) => (args[0] === "ls-files" ? "data/metrics/new-metric.ts\n" : "data/metrics/deleted-metric.ts\n");
  const keys = changedMetricKeys({ base: "origin/main", git, cwd: "/nonexistent" });
  assert.deepEqual(keys, []);
});
