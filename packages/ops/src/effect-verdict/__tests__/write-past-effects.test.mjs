/**
 * write-past-effects.mjs / scan-pending-improvements.mjs の追加フィールドのテスト。
 *
 * 実 backlog の effect/none|adverse は現在 0 件なので、動作は fixture で証明する
 * (「0 件だから未検証」にしない)。0 件でも正常終了することも固定する。
 * .claude の入口 (write-past-effects.mjs・triage-matrix.mjs) を起動する検査は
 * .claude/scripts/lib/__tests__/effect-verdict-wiring.test.mjs に置いた。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  buildLedgers,
  searchGrowthKeysOf,
  adsenseKeysOf,
  effectValueOf,
} from "../write-past-effects.mjs";
import { parseBacklog, overdueDays } from "../scan-pending-improvements.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
// ★fixture の deployed_at を書いた日に時刻を固定する。
//   実時刻を使うと「deployed 2026-07-28 = まだ 2 日」が日が経つと 15 日になり、
//   書いた日を過ぎた瞬間に必ず落ちる時限テストになる (2026-08-12 に実際に落ちた)。
const FIXED_TODAY = "2026-07-30T00:00:00Z";
const SCAN = path.join(PROJECT_ROOT, "packages/ops/src/effect-verdict/scan-pending-improvements.mjs");

const FIXTURE = `---
title: fixture
---

# 改善バックログ

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| FIX-OVERDUE-01 | deployed 2026-06-14。判定待ちのまま放置 | pending | 2026-09-30 | claude | adsense |
| FIX-FRESH-02 | deployed 2026-07-28。まだ 2 日 | pending | 2026-09-30 | claude | adsense |
| FIX-NONE-03 | \`/blog/price-index-high-low-prefecture\` の title 改修は効かなかった | effect/none | 2026-07-01 | claude | gsc |
| FIX-ADVERSE-04 | \`device-regression::Desktop\` の枠追加は悪化した | effect/adverse | 2026-07-01 | claude | adsense |
| FIX-NOKEY-05 | 対象 URL を書いていない施策 | effect/none | 2026-07-01 | claude | gsc |
| FIX-TYPED-06 | \`ctr-opportunity::/ranking/annual-sunshine-duration\` は効かなかった | effect/none | 2026-07-01 | claude | gsc |
`;

function withFixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "past-effects-test-"));
  const backlog = path.join(dir, "backlog.md");
  fs.writeFileSync(backlog, FIXTURE);
  try {
    return fn({ dir, backlog });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── scan-pending-improvements: deployed_at / overdue_days ─────────────

test("parseBacklog: deployed_at と overdue_days を出力する", () => {
  withFixture(({ backlog }) => {
    const entries = parseBacklog(backlog, new Date("2026-07-30T00:00:00Z"));
    const byId = Object.fromEntries(entries.map((e) => [e.section_id, e]));
    assert.equal(byId["FIX-OVERDUE-01"].deployed_at, "2026-06-14");
    assert.equal(byId["FIX-OVERDUE-01"].overdue_days, 46);
    assert.equal(byId["FIX-FRESH-02"].overdue_days, 2);
    assert.equal(byId["FIX-NONE-03"].deployed_at, null);
    assert.equal(byId["FIX-NONE-03"].overdue_days, null, "deploy 日が無い行は null (0 にしない)");
  });
});

test("overdueDays: 未指定は null / 日数は UTC の整数日", () => {
  assert.equal(overdueDays(null), null);
  assert.equal(overdueDays("2026-07-30", new Date("2026-07-30T23:59:00Z")), 0);
  assert.equal(overdueDays("2026-07-16", new Date("2026-07-30T00:00:00Z")), 14);
});

test("--overdue-days N は deployed_at を持つ行だけを残す", () => {
  withFixture(({ backlog }) => {
    const out = execFileSync("node", [SCAN, "--overdue-days", "14", "--status", "pending"], {
      encoding: "utf-8",
      env: { ...process.env, IMPROVEMENT_BACKLOG_PATH: backlog, IMPROVEMENT_TODAY: FIXED_TODAY },
    });
    const ids = JSON.parse(out).map((e) => e.section_id);
    assert.deepEqual(ids, ["FIX-OVERDUE-01"], "2 日しか経っていない行は落ちる");
  });
});

// ── write-past-effects: key 抽出 ───────────────────────────────────────

test("effectValueOf: effect/none|adverse だけを台帳 value にする", () => {
  assert.equal(effectValueOf("effect/none"), "none");
  assert.equal(effectValueOf("effect/adverse"), "adverse");
  assert.equal(effectValueOf("effect/pending"), null);
  assert.equal(effectValueOf("effect/full"), null);
  assert.equal(effectValueOf("pending"), null);
});

test("searchGrowthKeysOf: 素の path / type::path / BLOG-WAVE の slug を拾う", () => {
  assert.deepEqual(
    searchGrowthKeysOf({ section_id: "X", title: "`/blog/foo-bar` の改修" }),
    ["/blog/foo-bar"],
  );
  assert.deepEqual(
    searchGrowthKeysOf({ section_id: "X", title: "`ctr-opportunity::/ranking/abc` は効かなかった" }),
    ["/ranking/abc", "ctr-opportunity::/ranking/abc"],
  );
  const waveSlugs = new Map([["2026-05-25-auto", new Set(["a-slug", "b-slug"])]]);
  assert.deepEqual(
    searchGrowthKeysOf({ section_id: "BLOG-WAVE-2026-05-25-auto", title: "wave 判定" }, waveSlugs),
    ["/blog/a-slug", "/blog/b-slug"],
  );
});

test("searchGrowthKeysOf: サイト内 path でない文字列は拾わない", () => {
  assert.deepEqual(searchGrowthKeysOf({ section_id: "X", title: "/etc/passwd と 50/50 の話" }), []);
  assert.deepEqual(searchGrowthKeysOf({ section_id: "X", title: "対象 URL を書いていない" }), []);
});

test("adsenseKeysOf: 既知 rule の `<rule>::<key>` だけを拾う", () => {
  assert.deepEqual(adsenseKeysOf({ section_id: "X", title: "`device-regression::Desktop` が悪化" }), [
    "device-regression::Desktop",
  ]);
  assert.deepEqual(
    adsenseKeysOf({ section_id: "X", title: "placement-low-viewability::footer@mobile を直した" }),
    ["placement-low-viewability::footer@mobile"],
  );
  assert.deepEqual(adsenseKeysOf({ section_id: "X", title: "unknown-rule::foo" }), []);
});

test("buildLedgers: 2 台帳に振り分け、解決不能行は unmapped に残す", () => {
  withFixture(({ backlog }) => {
    const entries = parseBacklog(backlog, new Date("2026-07-30T00:00:00Z"));
    const built = buildLedgers(entries);
    assert.deepEqual(built.urls, {
      "/blog/price-index-high-low-prefecture": "none",
      "/ranking/annual-sunshine-duration": "none",
      "ctr-opportunity::/ranking/annual-sunshine-duration": "none",
    });
    assert.deepEqual(built.candidates, { "device-regression::Desktop": "adverse" });
    assert.deepEqual(
      built.unmapped.map((u) => u.id),
      ["FIX-NOKEY-05"],
      "key を解決できない行を黙って捨てない",
    );
    assert.ok(!("FIX-OVERDUE-01" in built.urls), "effect/pending 行は台帳に入れない");
  });
});

test("buildLedgers: 同一 key に none と adverse なら adverse を残す", () => {
  const entries = [
    { section_id: "A", title: "`/blog/x`", status: "effect/none", metric: "gsc" },
    { section_id: "B", title: "`/blog/x`", status: "effect/adverse", metric: "gsc" },
  ];
  assert.equal(buildLedgers(entries).urls["/blog/x"], "adverse");
});

// ── write-past-effects: CLI ───────────────────────────────────────────

test("search-growth 台帳の key 規約が scoring.mjs の lookup と一致する", async () => {
  const { buildCandidates } = await import("../../search-growth/lib/scoring.mjs");
  const url = "/blog/price-index-high-low-prefecture";
  const obs = (metric, value) => ({
    source: "gsc",
    metric,
    value,
    freshness: "fresh",
    observedAt: "2026-07-26T00:00:00Z",
    periodEnd: "2026-07-26",
    dimensions: { page: `https://stats47.jp${url}` },
  });
  const feed = [obs("impressions", 5000), obs("ctr", 0.001), obs("position", 8)];
  const base = buildCandidates(feed).find((c) => c.type === "ctr-opportunity");
  const built = buildLedgers([
    { section_id: "X", title: `\`${url}\` は効かなかった`, status: "effect/none", metric: "gsc" },
  ]);
  const suppressed = buildCandidates(feed, { pastEffects: built.urls }).find(
    (c) => c.type === "ctr-opportunity",
  );
  assert.ok(base && suppressed, "ctr-opportunity candidate が出ていない (前提崩れ)");
  assert.ok(
    suppressed.scoreBreakdown.confidence < base.scoreBreakdown.confidence,
    `writer の key で confidence が抑制されない: ${base.scoreBreakdown.confidence} → ${suppressed.scoreBreakdown.confidence}`,
  );
});
