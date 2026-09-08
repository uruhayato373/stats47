/** Pure request/output contracts for the weekly theme measurement slice. */
export const CLEAN_PAGE_COLUMNS = ['pagePath', 'screenPageViews', 'activeUsers', 'averageSessionDuration', 'engagementRate'];
export const THEME_NAV_API_DIMENSIONS = ['pagePath', 'customEvent:nav_surface', 'customEvent:nav_label'];
export const THEME_NAV_COLUMNS = ['pagePath', 'nav_surface', 'nav_label', 'eventCount'];
const exact = (fieldName, value) => ({ filter: { fieldName, stringFilter: { matchType: 'EXACT', value } } });
const japan = exact('country', 'Japan');

export function buildCleanPagesRequest(period) {
  return {
    dateRanges: [{ startDate: period.periodStart, endDate: period.periodEnd }],
    dimensions: [{ name: 'pagePath' }],
    metrics: CLEAN_PAGE_COLUMNS.slice(1).map((name) => ({ name })),
    dimensionFilter: japan,
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  };
}

export function buildThemeNavigationRequest(period) {
  return {
    dateRanges: [{ startDate: period.periodStart, endDate: period.periodEnd }],
    dimensions: THEME_NAV_API_DIMENSIONS.map((name) => ({ name })),
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { andGroup: { expressions: [
      japan,
      exact('eventName', 'nav_click'),
      { filter: { fieldName: 'customEvent:nav_surface', stringFilter: { matchType: 'BEGINS_WITH', value: 'theme_' } } },
    ] } },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  };
}

export function buildThemeReportMetadata({ period, rowCount, generatedAt = new Date().toISOString(), error }) {
  return {
    schemaVersion: 1, source: 'ga4', countryFilter: 'Japan',
    periodStart: period.periodStart, periodEnd: period.periodEnd, windowDays: 28,
    generatedAt, status: error ? 'failed' : 'ok', rowCount: error ? null : rowCount,
    ...(error ? { error } : {}),
  };
}
