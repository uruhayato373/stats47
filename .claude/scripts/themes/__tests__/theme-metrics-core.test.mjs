import test from "node:test";
import assert from "node:assert/strict";
import { selectThemeWindows, isJapanPageReport, summarizeThemeTraffic, summarizeThemeNavigation, normalizeThemePath } from "../theme-metrics-core.mjs";
import { observeCheckpoint } from "../evaluate-theme-experiments.mjs";

const windows = [
  { week: "2027-W04", periodStart: "2026-12-27", periodEnd: "2027-01-23", windowDays: 28 },
  { week: "2026-W53", periodStart: "2026-11-29", periodEnd: "2026-12-26", windowDays: 28 },
];
test("uses actual dates across week 53 and rejects overlapping windows", () => {
  assert.deepEqual(selectThemeWindows(windows), windows);
  assert.equal(selectThemeWindows([windows[0], { ...windows[1], periodEnd: "2027-01-01" }]), null);
});
test("raw and failed GA4 reports cannot qualify as Japan-only evidence", () => {
  const meta = { ...windows[0], source: "ga4", status: "ok", countryFilter: "Japan" };
  assert.equal(isJapanPageReport(meta), true);
  assert.equal(isJapanPageReport({ ...meta, countryFilter: "all" }), false);
  assert.equal(isJapanPageReport({ ...meta, status: "failed" }), false);
});
test("missing rows do not become zero demand; low samples omit ratios", () => {
  assert.equal(summarizeThemeTraffic([[], []], "gsc", windows).status, "insufficient-data");
  const low = summarizeThemeTraffic([[{ clicks: "1", impressions: "2" }], [{ clicks: "0", impressions: "3" }]], "gsc", windows);
  assert.equal(low.status, "measured-low");
  assert.equal(low.impressions, 5);
  assert.equal(low.ctr, undefined);
});
test("GA4 active users are not added across windows or URL variants", () => {
  const r = { screenPageViews: "100", activeUsers: "80", engagementRate: ".5", averageSessionDuration: "10" };
  const value = summarizeThemeTraffic([[r, r], [r]], "ga4", windows);
  assert.equal(value.pageViews, 300);
  assert.equal(value.activeUsersLast28d, null);
  assert.equal(normalizeThemePath("https://stats47.jp/themes/climate/?x=1"), "/themes/climate");
  assert.equal(normalizeThemePath("/themes/local-finance/cities"), null);
});

test("blank counts are unknown and blank auxiliary metrics are null, never zero", () => {
  const r = { screenPageViews: "", activeUsers: "", engagementRate: "", averageSessionDuration: "" };
  assert.equal(summarizeThemeTraffic([[r], [r]], "ga4", windows).status, "insufficient-data");
  const measured = summarizeThemeTraffic([[{ ...r, screenPageViews: "100" }], [{ ...r, screenPageViews: "100" }]], "ga4", windows);
  assert.equal(measured.activeUsersLast28d, null);
  assert.equal(measured.engagementRatePvWeighted, null);
  assert.equal(measured.avgSessionDurationSecPvWeighted, null);
});

test("navigation keeps dated 56-day evidence usable at the published experiment checkpoint", () => {
  const metrics = summarizeThemeNavigation([[{ eventCount: "7" }], [{ eventCount: "5" }]], windows);
  assert.equal(metrics.eventCount, 12);
  assert.equal(metrics.periodStart, "2026-11-29");
  assert.equal(metrics.periodEnd, "2027-01-23");
  const observation = observeCheckpoint({
    primaryKpi: "internalNav.eventCount", startedAt: "2026-11-28",
    baseline: { "internalNav.eventCount": 10 }, baselineScopes: { internalNav: "Japan" },
    baselineStatuses: { "internalNav.eventCount": "measured" },
  }, "d56", { metrics: { internalNav: metrics } }, "2027-01-24");
  assert.equal(observation.status, "eligible");
  assert.deepEqual(observation.reasons, []);
});

test("navigation refuses missing counts and overlapping or incomplete observation windows", () => {
  const rows = [[{ eventCount: "7" }], [{ eventCount: "5" }]];
  for (const [candidateRows, candidateWindows] of [
    [[[], rows[1]], windows],
    [[[{ eventCount: "" }], rows[1]], windows],
    [rows, null],
    [rows, [windows[0]]],
    [rows, [windows[0], { ...windows[1], periodEnd: windows[0].periodStart }]],
  ]) {
    const value = summarizeThemeNavigation(candidateRows, candidateWindows);
    assert.equal(value.status, "insufficient-data");
    assert.equal(value.eventCount, undefined);
  }
});
