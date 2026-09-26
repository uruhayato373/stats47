import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createGa4ImprovementsAdapter, extractGa4Pages, spansDiscontinuity, sumPageViews, GA4_MEASUREMENT_DISCONTINUITY_WEEK,
} from "../lib/ga4-improvements-adapter.mjs";
import { runAdapter } from "../../lib/effect-verdict/cli.mjs";

const rows = (pv) => [
  { pagePath: "/blog/a", screenPageViews: String(pv) },
  { pagePath: "/blog/a?x=1", screenPageViews: "10" },
  { pagePath: "/ranking/b", screenPageViews: "999" },
];

test("目印は [ga4-page: /path] だけを読み、PV は前方一致で合計する", () => {
  assert.deepEqual(extractGa4Pages("X [ga4-page: /blog/a] [ga4-page: /blog/a] Y"), ["/blog/a"]);
  assert.equal(sumPageViews(rows(100), ["/blog/a"]), 110);
});

test("2026-09-26 の計測不連続をまたぐ窓だけを交絡として扱う", () => {
  assert.equal(GA4_MEASUREMENT_DISCONTINUITY_WEEK, "2026-W39");
  assert.equal(spansDiscontinuity("2026-W37", "2026-W40"), true);
  assert.equal(spansDiscontinuity("2026-W40", "2026-W42"), false);
});

const entry = (title) => ({ section_id: "GA4-X-01", title, target_metric: "ga4", status: "effect/pending" });

function adapter(title, weeks, pvByWeek) {
  return createGa4ImprovementsAdapter({
    entries: [entry(title)], availableWeeks: weeks, loadPages: (w) => rows(pvByWeek[w] ?? 0), minWeeks: 2, logPath: "/tmp/x.md",
  });
}

test("目印が揃った施策は判定され、不連続をまたぐと confounded で pending に留まる", () => {
  const title = "施策 [ga4-page: /blog/a] デプロイ済 2026-09-01 [target: +200 pageviews]";
  const crossing = runAdapter(adapter(title, ["2026-W35", "2026-W40"], { "2026-W35": 500, "2026-W40": 900 }));
  assert.equal(crossing.length, 1);
  assert.equal(crossing[0].label, "effect/pending");
  assert.ok(crossing[0].guards.some((g) => g.code === "confounded"));
});

test("不連続の後だけの窓は交絡なしで判定される (効果あり)", () => {
  const title = "施策 [ga4-page: /blog/a] デプロイ済 2026-10-05 [target: +200 pageviews]";
  const v = runAdapter(adapter(title, ["2026-W40", "2026-W44"], { "2026-W40": 500, "2026-W44": 900 }));
  assert.equal(v[0].skipped, false);
  assert.ok(!v[0].guards.some((g) => g.code === "confounded"));
  assert.equal(v[0].before.value, 510);
  assert.equal(v[0].after.value, 910);
  assert.equal(v[0].label, "effect/full");
});

test("目印の無い施策は subject にしない (散文から推測しない)", () => {
  const a = adapter("ページの回遊を改善した", ["2026-W40"], {});
  assert.equal(a.listSubjects().length, 0);
});
