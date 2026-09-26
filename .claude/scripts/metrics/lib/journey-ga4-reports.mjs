/**
 * Pure request/aggregation contracts for the weekly journey slice (Japan-only, rolling 28d).
 *
 * - internal-transitions: same-site page_view を「参照元セクション → 着地セクション」に集約する。
 *   nav_click の計装漏れに左右されずに blog→ranking / theme→ranking などの回遊を読むため。
 * - landing-context: 着地ページ別に desktop 比率と平日業務時間 (月〜金 9:00–17:59, property TZ) 比率を出す。
 *   行政実務など業務文脈の読者がどの着地に集まるかを見るため。祝日は区別しない。
 * - event-volume: イベント別の発火量。未登録 custom dimension を登録すると分析できる量があるかの判断に使う。
 */
const exact = (fieldName, value) => ({ filter: { fieldName, stringFilter: { matchType: 'EXACT', value } } });
const japan = exact('country', 'Japan');
const SITE_HOST = 'stats47.jp';

export const TRANSITION_COLUMNS = ['from_section', 'to_section', 'pageViews'];
export const LANDING_CONTEXT_COLUMNS = [
  'landingPage', 'sessions', 'engagedSessions', 'avgEngagementSec', 'pagesPerSession', 'desktopShare', 'workdayHoursShare',
];
export const LANDING_MIN_SESSIONS = 10;
export const EVENT_VOLUME_COLUMNS = ['eventName', 'eventCount', 'totalUsers'];

const range = (period) => [{ startDate: period.periodStart, endDate: period.periodEnd }];

export function sectionOf(path) {
  const segment = String(path).split(/[?#]/)[0].split('/')[1];
  return segment ? segment : 'home';
}

export function buildInternalTransitionsRequest(period) {
  return {
    dateRanges: range(period),
    dimensions: [{ name: 'pageReferrer' }, { name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { andGroup: { expressions: [
      japan,
      exact('eventName', 'page_view'),
      { filter: { fieldName: 'pageReferrer', stringFilter: { matchType: 'CONTAINS', value: `${SITE_HOST}/` } } },
    ] } },
  };
}

/** rows: [{ pageReferrer, pagePath, eventCount }] → [{ from_section, to_section, pageViews }] */
export function aggregateTransitions(rows) {
  const totals = new Map();
  for (const row of rows) {
    let referrer;
    try { referrer = new URL(row.pageReferrer); } catch { continue; }
    if (referrer.hostname !== SITE_HOST && !referrer.hostname.endsWith(`.${SITE_HOST}`)) continue;
    const key = `${sectionOf(referrer.pathname)}\t${sectionOf(row.pagePath)}`;
    totals.set(key, (totals.get(key) ?? 0) + Number(row.eventCount));
  }
  return [...totals].map(([key, pageViews]) => {
    const [from_section, to_section] = key.split('\t');
    return { from_section, to_section, pageViews };
  }).sort((a, b) => b.pageViews - a.pageViews || a.from_section.localeCompare(b.from_section) || a.to_section.localeCompare(b.to_section));
}

export function buildEventVolumeRequest(period) {
  return {
    dateRanges: range(period),
    dimensions: [{ name: 'eventName' }],
    metrics: EVENT_VOLUME_COLUMNS.slice(1).map((name) => ({ name })),
    dimensionFilter: japan,
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  };
}

export function buildLandingContextRequests(period) {
  const base = { dateRanges: range(period), dimensionFilter: japan };
  return {
    base: { ...base, dimensions: [{ name: 'landingPage' }],
      metrics: ['sessions', 'engagedSessions', 'userEngagementDuration', 'screenPageViews'].map((name) => ({ name })) },
    device: { ...base, dimensions: [{ name: 'landingPage' }, { name: 'deviceCategory' }], metrics: [{ name: 'sessions' }] },
    hour: { ...base, dimensions: [{ name: 'landingPage' }, { name: 'dayOfWeek' }, { name: 'hour' }], metrics: [{ name: 'sessions' }] },
  };
}

export function isWorkdayHour(dayOfWeek, hour) {
  const d = Number(dayOfWeek), h = Number(hour);
  return d >= 1 && d <= 5 && h >= 9 && h < 18;
}

const round = (value, digits) => Number(value.toFixed(digits));

/** 3 本の raw rows を着地ページ単位に合成する。sessions < minSessions は比率が不安定なので出さない。 */
export function aggregateLandingContext({ base, device, hour }, { minSessions = LANDING_MIN_SESSIONS } = {}) {
  const desktop = new Map(), deviceTotal = new Map(), workday = new Map(), hourTotal = new Map();
  const add = (map, key, value) => map.set(key, (map.get(key) ?? 0) + Number(value));
  for (const row of device) {
    add(deviceTotal, row.landingPage, row.sessions);
    if (row.deviceCategory === 'desktop') add(desktop, row.landingPage, row.sessions);
  }
  for (const row of hour) {
    add(hourTotal, row.landingPage, row.sessions);
    if (isWorkdayHour(row.dayOfWeek, row.hour)) add(workday, row.landingPage, row.sessions);
  }
  return base
    .filter((row) => Number(row.sessions) >= minSessions)
    .map((row) => {
      const sessions = Number(row.sessions);
      const share = (part, total) => (total.get(row.landingPage) ? (part.get(row.landingPage) ?? 0) / total.get(row.landingPage) : 0);
      return {
        landingPage: row.landingPage,
        sessions,
        engagedSessions: Number(row.engagedSessions),
        avgEngagementSec: round(Number(row.userEngagementDuration) / sessions, 1),
        pagesPerSession: round(Number(row.screenPageViews) / sessions, 2),
        desktopShare: round(share(desktop, deviceTotal), 3),
        workdayHoursShare: round(share(workday, hourTotal), 3),
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.landingPage.localeCompare(b.landingPage));
}

// ── GA4-FULL-MEASUREMENT-01 Phase 5: 2026-09-26 に登録した dimension の週次スライス ──────────────
// どれも Japan-only・rolling28d。値の語彙は apps/web/src/lib/analytics の固定語彙に従う。
// 登録日 (2026-09-26) より前の期間は (not set) が混ざるため、読む側は meta の periodStart を確認する。
const japanAnd = (...rest) => ({ andGroup: { expressions: [japan, ...rest] } });
const eventIs = (name) => exact('eventName', name);
const eventIn = (names) => ({ filter: { fieldName: 'eventName', inListFilter: { values: names } } });

/** 成果として定義した key event (google-admin AUTHORED_KEY_EVENTS と同じ集合)。 */
export const KEY_EVENT_NAMES = ['affiliate_click', 'contact_click', 'cta_click', 'file_download'];

export const MEASUREMENT_REPORTS = Object.freeze({
  'content-group': {
    columns: ['contentGroup', 'sessionDefaultChannelGroup', 'deviceCategory', 'screenPageViews', 'engagedSessions', 'keyEvents'],
    request: (period) => ({
      dateRanges: range(period),
      dimensions: ['contentGroup', 'sessionDefaultChannelGroup', 'deviceCategory'].map((name) => ({ name })),
      metrics: ['screenPageViews', 'engagedSessions', 'keyEvents'].map((name) => ({ name })),
      dimensionFilter: japan,
    }),
    dims: ['contentGroup', 'sessionDefaultChannelGroup', 'deviceCategory'],
    metrics: ['screenPageViews', 'engagedSessions', 'keyEvents'],
  },
  'key-events': {
    columns: ['eventName', 'landingPage', 'contentGroup', 'eventCount'],
    request: (period) => ({
      dateRanges: range(period),
      dimensions: ['eventName', 'landingPage', 'contentGroup'].map((name) => ({ name })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: japanAnd(eventIn(KEY_EVENT_NAMES)),
    }),
    dims: ['eventName', 'landingPage', 'contentGroup'],
    metrics: ['eventCount'],
  },
  interactions: {
    columns: ['ui_action', 'ui_target', 'contentGroup', 'eventCount'],
    request: (period) => ({
      dateRanges: range(period),
      dimensions: ['customEvent:ui_action', 'customEvent:ui_target', 'contentGroup'].map((name) => ({ name })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: japanAnd(eventIs('ui_interaction')),
    }),
    dims: ['customEvent:ui_action', 'customEvent:ui_target', 'contentGroup'],
    metrics: ['eventCount'],
  },
  'read-progress': {
    columns: ['pagePath', 'progress', 'eventCount'],
    request: (period) => ({
      dateRanges: range(period),
      dimensions: ['pagePath', 'customEvent:progress'].map((name) => ({ name })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: japanAnd(eventIs('read_progress')),
    }),
    dims: ['pagePath', 'customEvent:progress'],
    metrics: ['eventCount'],
  },
  'download-purpose': {
    columns: ['ranking_key', 'download_purpose', 'eventCount'],
    request: (period) => ({
      dateRanges: range(period),
      dimensions: ['customEvent:ranking_key', 'customEvent:download_purpose'].map((name) => ({ name })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: japanAnd(eventIs('csv_download_purpose')),
    }),
    dims: ['customEvent:ranking_key', 'customEvent:download_purpose'],
    metrics: ['eventCount'],
  },
});

/** GA4 の dimension 名 (customEvent:xxx) を CSV の列名 (xxx) に揃える。 */
export function measurementRow(row, report) {
  const out = {};
  report.dims.forEach((d, i) => { out[report.columns[i]] = row[d]; });
  report.metrics.forEach((m) => { out[m] = row[m]; });
  return out;
}
