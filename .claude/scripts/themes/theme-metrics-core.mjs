import { addDays } from "../metrics/lib/periods.mjs";

/** Select adjacent, non-overlapping 28-day reports by their actual dates, including ISO week 53. */
export function selectThemeWindows(reports, requestedWeeks) {
  const valid = reports.filter((r) => r.windowDays === 28 && /^\d{4}-\d{2}-\d{2}$/.test(r.periodStart ?? "") && r.periodEnd === addDays(r.periodStart, 27));
  const selected = requestedWeeks ? valid.filter((r) => requestedWeeks.includes(r.week)) : valid;
  const latest = [...selected].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
  if (!latest) return null;
  const previous = selected.find((r) => r.periodEnd === addDays(latest.periodStart, -1));
  return previous ? [latest, previous] : null;
}

export function isJapanPageReport(meta) {
  return meta?.status === "ok" && meta.source === "ga4" && meta.countryFilter === "Japan"
    && meta.windowDays === 28 && /^\d{4}-\d{2}-\d{2}$/.test(meta.periodStart ?? "") && meta.periodEnd === addDays(meta.periodStart, 27);
}

export function finiteCount(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function normalizeThemePath(raw) {
  return raw.match(/^(?:https:\/\/stats47\.jp)?(\/themes\/[a-z0-9-]+)\/?(?:[?#].*)?$/)?.[1] ?? null;
}

/** Preserve the same dated 56-day evidence contract for navigation KPIs. */
export function summarizeThemeNavigation(rowsByWindow, windows) {
  const insufficient = { status: "insufficient-data", windowDays: 0, scope: "Japan", reason: "navigation reports or page rows missing" };
  if (!windows || windows.length !== 2 || rowsByWindow.length !== 2) return insufficient;
  const selected = selectThemeWindows(windows);
  if (!selected || selected.some((window, index) => window !== windows[index])
      || new Set(windows.map((window) => window.week)).size !== 2
      || rowsByWindow.some((rows) => !rows.length || rows.some((row) => finiteCount(row.eventCount) === null))) return insufficient;
  const eventCount = rowsByWindow.flat().reduce((sum, row) => sum + Number(row.eventCount), 0);
  if (!Number.isFinite(eventCount)) return insufficient;
  return {
    status: "measured", windowDays: 56, scope: "Japan",
    weeks: windows.map((window) => window.week).sort(),
    periodStart: windows[1].periodStart, periodEnd: windows[0].periodEnd, eventCount,
  };
}

/** Missing report rows are unknown, not zero demand. Ratio estimates require sufficient samples. */
export function summarizeThemeTraffic(rowsByWindow, source, windows) {
  const scope = source === "ga4" ? "Japan" : "search-console";
  if (!windows || rowsByWindow.some((rows) => !rows.length)) {
    return { status: "insufficient-data", windowDays: 0, scope, reason: "non-overlapping reports or page rows missing" };
  }
  const metadata = { windowDays: 56, scope, weeks: windows.map((w) => w.week).sort(), periodStart: windows[1].periodStart, periodEnd: windows[0].periodEnd };
  const rows = rowsByWindow.flat();
  const round = (n, d) => Number(n.toFixed(d));
  const required = source === "gsc" ? ["clicks", "impressions"] : ["screenPageViews"];
  if (rows.some((r) => required.some((key) => finiteCount(r[key]) === null))) return { status: "insufficient-data", windowDays: 0, scope, reason: "missing or invalid counts" };
  if (source === "gsc") {
    const clicks = rows.reduce((n, r) => n + Number(r.clicks), 0);
    const impressions = rows.reduce((n, r) => n + Number(r.impressions), 0);
    if (![clicks, impressions].every(Number.isFinite)) return { status: "insufficient-data", windowDays: 0, scope, reason: "invalid counts" };
    const counts = { ...metadata, clicks, impressions };
    if (impressions < 200) return { status: "measured-low", ...counts };
    return { status: "measured", ...counts, ctr: round(clicks / impressions, 4), avgPosition: rows.some((r) => finiteCount(r.position) === null) ? null : round(rows.reduce((n, r) => n + Number(r.position) * Number(r.impressions), 0) / impressions, 2) };
  }
  const pageViews = rows.reduce((n, r) => n + Number(r.screenPageViews), 0);
  if (!Number.isFinite(pageViews)) return { status: "insufficient-data", windowDays: 0, scope, reason: "invalid counts" };
  const counts = { ...metadata, pageViews };
  if (pageViews < 100) return { status: "measured-low", ...counts };
  return {
    status: "measured", ...counts,
    // Query-string variants can share users. Do not sum activeUsers across those rows.
    activeUsersLast28d: rowsByWindow[0].length === 1 ? finiteCount(rowsByWindow[0][0].activeUsers) : null,
    engagementRatePvWeighted: rows.some((r) => finiteCount(r.engagementRate) === null || Number(r.engagementRate) > 1) ? null : round(rows.reduce((n, r) => n + Number(r.engagementRate) * Number(r.screenPageViews), 0) / pageViews, 4),
    avgSessionDurationSecPvWeighted: rows.some((r) => finiteCount(r.averageSessionDuration) === null) ? null : round(rows.reduce((n, r) => n + Number(r.averageSessionDuration) * Number(r.screenPageViews), 0) / pageViews, 1),
  };
}
