/**
 * 週次 snapshot の ranges.adsense と、AdSense の LATEST.md の期間行 (backlog 2026-11-14: どの 7 日の金額か示せなかった)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeekRanges } from "../../lib/metrics-reader.mjs";
import { resolvePeriods } from "../../../../packages/ops/src/metrics/periods.mjs";
import { markdownAdsense } from "../update-history-csv.mjs";

const NOW = Date.parse("2026-11-14T00:00:00Z");

test("ranges.adsense は取得スクリプトと同じ期間契約 (取得遅延 1 日) で、ga4・gsc と同じ形", () => {
  const ranges = computeWeekRanges({ week: "2026-W45", now: NOW });
  assert.deepEqual(ranges.adsense.this, { start: "2026-11-01", end: "2026-11-07" });
  assert.deepEqual(ranges.adsense.prev, { start: "2026-10-25", end: "2026-10-31" });
  const periods = resolvePeriods({ source: "adsense", week: "2026-W45", now: NOW });
  assert.deepEqual(ranges.adsense.finalized7d, periods.finalized7d);
  assert.deepEqual(ranges.adsense.previous7d, periods.previous7d);
  assert.deepEqual(Object.keys(ranges.adsense).sort(), Object.keys(ranges.ga4).sort());
  assert.equal(ranges.delayDays.adsense, 1);
});

test("LATEST.md の確定7日に開始日と終了日が出る", () => {
  const row = { week: "2026-W45", earnings: "461.00", page_views: "11649", rpm: "40.000", impressions: "15546",
    clicks: "55", ctr: "0.0035", impressions_rpm: "30", cost_per_click: "8" };
  const md = markdownAdsense([row], row, null);
  assert.match(md, /期間: 2026-11-01 〜 2026-11-07 \(前週比の相手: 2026-10-25 〜 2026-10-31\)/);
});
