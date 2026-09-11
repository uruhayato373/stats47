import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectThemeWindows, selectLatestThemeWindow, isJapanPageReport, summarizeThemeTraffic, summarizeThemeNavigation, normalizeThemePath } from "../theme-metrics-core.mjs";
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
    baselinePeriod: { from: "2026-10-03", to: "2026-11-27" },
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

test("a single successful 28-day window is observed before a 56-day pair exists", () => {
  assert.deepEqual(selectLatestThemeWindow([windows[0]]), windows[0]);
  assert.equal(selectThemeWindows([windows[0]]), null);
  const traffic = summarizeThemeTraffic([[{ screenPageViews: "100", activeUsers: "80" }]], "ga4", [windows[0]]);
  const nav = summarizeThemeNavigation([[{ eventCount: "7" }]], [windows[0]]);
  assert.equal(traffic.windowDays, 28);
  assert.equal(traffic.pageViews, 100);
  assert.equal(nav.windowDays, 28);
  assert.equal(nav.eventCount, 7);
  const record = observeCheckpoint({ changeType: "launch", primaryKpi: "ga4.pageViews", startedAt: "2026-12-27" },
    "d28", { metrics: { ga4: { ...traffic, windowDays: 56, pageViews: 900 } }, metrics28d: { ga4: traffic } }, "2027-01-24");
  assert.equal(record.status, "launch-provisional");
  assert.equal(record.values["ga4.pageViews"].value, 100);
});

test("28-day missing rows remain unknown and invalid/duplicate periods cannot become measured traffic", () => {
  assert.equal(summarizeThemeTraffic([[]], "ga4", [windows[0]]).status, "insufficient-data");
  assert.equal(selectLatestThemeWindow([{ ...windows[0], periodStart: "2026-02-30" }]), null);
  const rows = [[{ screenPageViews: "100" }], [{ screenPageViews: "100" }]];
  for (const bad of [[windows[0], windows[0]], [windows[1], windows[0]], []])
    assert.equal(summarizeThemeTraffic(rows, "ga4", bad).status, "insufficient-data");
});

test("aggregate CLI writes independent 28/56-day totals and can use the first Japan-only report", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-theme-aggregate-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const gsc = path.join(dir, "gsc");
  const ga4 = path.join(dir, "ga4");
  fs.writeFileSync(path.join(dir, "portfolio.json"), JSON.stringify({ themes: [{ themeKey: "climate", metrics: {} }] }));
  const write = (base, window, file, content) => {
    fs.mkdirSync(path.join(base, window.week), { recursive: true });
    fs.writeFileSync(path.join(base, window.week, file), content);
  };
  for (const window of windows) {
    write(gsc, window, "summary.json", JSON.stringify({ rolling28d: window }));
    write(gsc, window, "pages.csv", "page,clicks,impressions,position\nhttps://stats47.jp/themes/climate,10,400,4\n");
  }
  write(ga4, windows[0], "pages-clean.meta.json", JSON.stringify({ ...windows[0], source: "ga4", status: "ok", countryFilter: "Japan" }));
  write(ga4, windows[0], "pages-clean.csv", "pagePath,screenPageViews,activeUsers,engagementRate,averageSessionDuration\n/themes/climate,100,80,0.5,20\n");
  const run = () => spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(new URL("../aggregate-theme-metrics.ts", import.meta.url))], {
    encoding: "utf8", env: { ...process.env, STATE_DIR: dir, GSC_SNAPSHOT_DIR: gsc, GA4_SNAPSHOT_DIR: ga4 },
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "portfolio.json"))).themes[0];
  assert.equal(saved.metrics.gsc.impressions, 800);
  assert.equal(saved.metrics.gsc.windowDays, 56);
  assert.equal(saved.metrics28d.gsc.impressions, 400);
  assert.equal(saved.metrics28d.gsc.windowDays, 28);
  assert.equal(saved.metrics.ga4.status, "insufficient-data");
  assert.equal(saved.metrics28d.ga4.pageViews, 100);
  write(ga4, windows[0], "pages-clean.meta.json", JSON.stringify({ ...windows[0], source: "ga4", status: "ok", countryFilter: "all" }));
  assert.equal(run().status, 0);
  const rejected = JSON.parse(fs.readFileSync(path.join(dir, "portfolio.json"))).themes[0];
  assert.equal(rejected.metrics28d.ga4.status, "insufficient-data");
  assert.equal(rejected.metrics28d.ga4.pageViews, undefined);
});
