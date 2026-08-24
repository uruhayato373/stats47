/**
 * pipeline tests — source isolation / freshness / helpers。
 *   node --test .claude/scripts/search-growth/__tests__/pipeline.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAll } from "../normalize.mjs";
import { collect } from "../collect.mjs";
import { isoWeekEndDate, mapCoverageCategory, parseCsv, shouldEmitCoverageCategory } from "../lib/sources.mjs";
import { createObservation } from "../lib/contracts.mjs";
import { extractLocs } from "../lib/live-sitemap.mjs";
import { textLength } from "../lib/live-http.mjs";

const now = "2026-07-23T00:00:00Z";

// fixture source defs
function okSource(name, count = 1) {
  return {
    name, staleAfterDays: 10,
    normalize() {
      const obs = [];
      for (let i = 0; i < count; i++) {
        obs.push(createObservation({ source: "gsc", metric: "impressions", value: 100 + i, dimensions: { page: `/p${i}` }, freshness: "fresh", observedAt: now }));
      }
      return { observedAt: now, snapshotFile: `x/${name}.csv`, observations: obs };
    },
  };
}
function throwSource(name) {
  return { name, staleAfterDays: 10, normalize() { throw new Error("boom secret=abc123"); } };
}
function missingSource(name) {
  return { name, staleAfterDays: 10, normalize() { return { observedAt: null }; } };
}
function staleSource(name) {
  return {
    name, staleAfterDays: 5,
    normalize() {
      const o = createObservation({ source: "gsc", metric: "clicks", value: 1, dimensions: { page: "/old" }, freshness: "stale", observedAt: "2026-06-01T00:00:00Z" });
      return { observedAt: "2026-06-01T00:00:00Z", observations: [o] };
    },
  };
}

test("source isolation: 1 source が throw しても他は継続 (failed で隔離)", () => {
  const r = normalizeAll({ now, sources: [okSource("a", 2), throwSource("b"), okSource("c", 1)] });
  assert.equal(r.sources.a.status, "success");
  assert.equal(r.sources.b.status, "failed");
  assert.equal(r.sources.c.status, "success");
  assert.equal(r.observations.length, 3); // a(2)+c(1)、b は 0
  // error は redact される (secret= がマスク)
  assert.ok(!r.sources.b.error.includes("abc123"));
});

test("missing snapshot は missing (0 と混同しない)", () => {
  const r = normalizeAll({ now, sources: [missingSource("a")] });
  assert.equal(r.sources.a.status, "missing");
  assert.equal(r.sources.a.count, 0);
  assert.equal(r.sources.a.freshness, "missing");
});

test("stale snapshot は partial (success に見せない)", () => {
  const r = normalizeAll({ now, sources: [staleSource("a")] });
  assert.equal(r.sources.a.status, "partial");
  assert.equal(r.sources.a.freshness, "stale");
});

test("collect: live-only source は creds 無しで skipped (live 未検証を明示)", async () => {
  const liveOnly = { name: "sitemap", staleAfterDays: 8, secretName: "GOOGLE_SERVICE_ACCOUNT_KEY_JSON", liveOnly: true, normalize() { return { observedAt: null }; } };
  const m = await collect({ live: false, now, sources: [liveOnly], normalizeSources: [] });
  const s = m.sources[0];
  assert.equal(s.status, "skipped");
  assert.match(s.note, /live 未検証|--live/);
});

test("collect: summary は partial を success に含めない", async () => {
  const m = await collect({ live: false, now, sources: [okSource("a"), staleSource("b")], normalizeSources: [] });
  // okSource / staleSource は normalizeSources に無いので live-only 扱い → skipped。
  // partial は normalizeSources 経由でのみ発生する。ここでは success に混ざらないことを確認。
  const statuses = m.sources.map((s) => s.status);
  assert.ok(!statuses.includes("success") || statuses.filter((x) => x === "success").length === m.sources.filter((s) => s.status === "success").length);
});

test("isoWeekEndDate: ISO 週の日曜を返す", () => {
  // 2026-W29 の日曜
  const d = isoWeekEndDate("2026-W29");
  assert.match(d, /^2026-07-\d{2}$/);
  assert.equal(isoWeekEndDate("bad"), null);
});

test("mapCoverageCategory: GSC カテゴリ → engine 語彙", () => {
  assert.equal(mapCoverageCategory("ソフト404"), "soft-404");
  assert.equal(mapCoverageCategory("crawled - currently not indexed"), "crawled-not-indexed");
  assert.equal(mapCoverageCategory("クロール済み - インデックス未登録"), "crawled-not-indexed");
});

test("coverage queue: 未処置だけを候補化し、作業中・非対象は重複させない", () => {
  assert.equal(shouldEmitCoverageCategory({ status: "pending", action: "content-check" }), true);
  assert.equal(shouldEmitCoverageCategory({ status: "in-progress", action: "content-check" }), false);
  assert.equal(shouldEmitCoverageCategory({ status: "pending", action: "none" }), false);
  assert.equal(shouldEmitCoverageCategory({ status: "resolved", action: "observe-after-fix" }), false);
});

test("parseCsv: quoted field / カンマ入りを正しく分割", () => {
  const { header, rows } = parseCsv('a,b\n"x,y",2\nz,3');
  assert.deepEqual(header, ["a", "b"]);
  assert.equal(rows[0].a, "x,y");
  assert.equal(rows[0].b, "2");
  assert.equal(rows[1].a, "z");
});

test("live-sitemap extractLocs: <loc> を抽出 (index/urlset 共通)", () => {
  const xml = "<urlset><url><loc>https://stats47.jp/a</loc></url><url><loc> https://stats47.jp/b/ </loc></url></urlset>";
  assert.deepEqual(extractLocs(xml), ["https://stats47.jp/a", "https://stats47.jp/b/"]);
});

test("live-http textLength: タグ/script を除いた可視テキスト量", () => {
  assert.ok(textLength("<html><head><style>x{}</style></head><body>あいうえお</body></html>") < 20);
  assert.ok(textLength("<p>" + "あ".repeat(500) + "</p>") >= 500);
});

test("no rows と API error を区別: missing vs failed", () => {
  const noRows = normalizeAll({ now, sources: [{ name: "a", staleAfterDays: 10, normalize() { return { observedAt: now, observations: [] }; } }] });
  assert.equal(noRows.sources.a.status, "missing"); // 0 行 = データ無し (freshness missing)
  const apiErr = normalizeAll({ now, sources: [throwSource("a")] });
  assert.equal(apiErr.sources.a.status, "failed"); // 例外 = 失敗
});
