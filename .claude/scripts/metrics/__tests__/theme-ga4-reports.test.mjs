import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCleanPagesRequest, buildThemeNavigationRequest, buildThemeReportMetadata } from '../lib/theme-ga4-reports.mjs';

const period = { periodStart: '2026-08-09', periodEnd: '2026-09-05' };
test('clean pages uses the explicit 28-day Japan slice, not raw or calendar week', () => {
  const request = buildCleanPagesRequest(period);
  assert.deepEqual(request.dateRanges, [{ startDate: period.periodStart, endDate: period.periodEnd }]);
  assert.equal(request.dimensionFilter.filter.fieldName, 'country');
  assert.equal(request.dimensionFilter.filter.stringFilter.value, 'Japan');
  assert.deepEqual(request.dimensions, [{ name: 'pagePath' }]);
});
test('theme navigation uses existing dimensions and excludes other nav surfaces', () => {
  const request = buildThemeNavigationRequest(period);
  const filters = request.dimensionFilter.andGroup.expressions.map((item) => item.filter);
  assert.deepEqual(filters.map((filter) => filter.stringFilter.value), ['Japan', 'nav_click', 'theme_']);
  assert.equal(filters[2].stringFilter.matchType, 'BEGINS_WITH');
  assert.deepEqual(request.metrics, [{ name: 'eventCount' }]);
});
test('metadata distinguishes an empty successful report from a failed refresh', () => {
  const ok = buildThemeReportMetadata({ period, rowCount: 0, generatedAt: 'fixture' });
  const failed = buildThemeReportMetadata({ period, rowCount: 9, error: 'unavailable', generatedAt: 'fixture' });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.rowCount, 0);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.rowCount, null);
  assert.equal(failed.countryFilter, 'Japan');
  assert.equal(failed.periodStart, period.periodStart);
  assert.equal(failed.windowDays, 28);
});
