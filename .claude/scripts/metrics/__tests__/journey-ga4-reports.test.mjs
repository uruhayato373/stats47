import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregateLandingContext, aggregateTransitions, buildInternalTransitionsRequest, buildLandingContextRequests,
  isWorkdayHour, sectionOf,
} from '../lib/journey-ga4-reports.mjs';

const period = { periodStart: '2026-08-24', periodEnd: '2026-09-20' };

test('transitions request reads same-site page_view referrers in the Japan 28-day slice', () => {
  const request = buildInternalTransitionsRequest(period);
  assert.deepEqual(request.dateRanges, [{ startDate: period.periodStart, endDate: period.periodEnd }]);
  const values = request.dimensionFilter.andGroup.expressions.map((item) => item.filter.stringFilter.value);
  assert.deepEqual(values, ['Japan', 'page_view', 'stats47.jp/']);
});

test('referrer query strings do not split a section, and external referrers are dropped', () => {
  // BLOG-SRCLINK / THEME-INTERNALNAV の判定は「blog→ranking」のようなセクション単位で読む。
  // クエリ付き referrer が別行になると同じ遷移が分散し、他サイト経由が混ざると回遊率が水増しされる。
  const rows = aggregateTransitions([
    { pageReferrer: 'https://stats47.jp/blog/a?utm_source=x', pagePath: '/ranking/r1', eventCount: '3' },
    { pageReferrer: 'https://stats47.jp/blog/b', pagePath: '/ranking/r2', eventCount: '2' },
    { pageReferrer: 'https://stats47.jp/', pagePath: '/themes/t', eventCount: '1' },
    { pageReferrer: 'https://example.com/stats47.jp/blog/a', pagePath: '/ranking/r1', eventCount: '9' },
    { pageReferrer: '', pagePath: '/ranking/r1', eventCount: '4' },
  ]);
  assert.deepEqual(rows, [
    { from_section: 'blog', to_section: 'ranking', pageViews: 5 },
    { from_section: 'home', to_section: 'themes', pageViews: 1 },
  ]);
  assert.equal(sectionOf('/'), 'home');
  assert.equal(sectionOf('/themes/local-finance?kpi=1'), 'themes');
});

test('workday hours are Mon-Fri 9:00-17:59 only', () => {
  assert.equal(isWorkdayHour('1', '09'), true);
  assert.equal(isWorkdayHour('5', '17'), true);
  assert.equal(isWorkdayHour('5', '18'), false);
  assert.equal(isWorkdayHour('1', '08'), false);
  assert.equal(isWorkdayHour('0', '10'), false); // Sunday
  assert.equal(isWorkdayHour('6', '10'), false); // Saturday
});

test('landing context computes shares per landing page and hides unstable small pages', () => {
  const requests = buildLandingContextRequests(period);
  assert.deepEqual(requests.hour.dimensions.map((d) => d.name), ['landingPage', 'dayOfWeek', 'hour']);
  const rows = aggregateLandingContext({
    base: [
      { landingPage: '/blog/work', sessions: '20', engagedSessions: '15', userEngagementDuration: '1200', screenPageViews: '40' },
      { landingPage: '/blog/tiny', sessions: '9', engagedSessions: '9', userEngagementDuration: '90', screenPageViews: '9' },
    ],
    device: [
      { landingPage: '/blog/work', deviceCategory: 'desktop', sessions: '15' },
      { landingPage: '/blog/work', deviceCategory: 'mobile', sessions: '5' },
    ],
    hour: [
      { landingPage: '/blog/work', dayOfWeek: '2', hour: '10', sessions: '12' },
      { landingPage: '/blog/work', dayOfWeek: '6', hour: '10', sessions: '8' },
    ],
  });
  assert.deepEqual(rows, [{
    landingPage: '/blog/work', sessions: 20, engagedSessions: 15, avgEngagementSec: 60,
    pagesPerSession: 2, desktopShare: 0.75, workdayHoursShare: 0.6,
  }]);
});

test('Phase 5 slices: every request is Japan-only and filters to its own event', async () => {
  const { MEASUREMENT_REPORTS, KEY_EVENT_NAMES } = await import('../lib/journey-ga4-reports.mjs');
  const expectEvent = { interactions: 'ui_interaction', 'read-progress': 'read_progress', 'download-purpose': 'csv_download_purpose' };
  for (const [name, report] of Object.entries(MEASUREMENT_REPORTS)) {
    const req = report.request(period);
    const filters = req.dimensionFilter.andGroup?.expressions ?? [req.dimensionFilter];
    assert.equal(filters[0].filter.stringFilter.value, 'Japan', `${name} は Japan-only`);
    if (expectEvent[name]) assert.equal(filters[1].filter.stringFilter.value, expectEvent[name]);
    assert.equal(report.columns.length, report.dims.length + report.metrics.length, `${name} の列数`);
  }
  // key event の集合は google-admin の AUTHORED_KEY_EVENTS と一致させる (片方だけ増やすと成果が数えられない)
  const { AUTHORED_KEY_EVENTS } = await import('../../google-admin/apply-allowlisted-settings.mjs');
  assert.deepEqual([...KEY_EVENT_NAMES].sort(), AUTHORED_KEY_EVENTS.map((k) => k.eventName).sort());
});

test('measurementRow maps customEvent:* dimensions to plain CSV column names', async () => {
  const { MEASUREMENT_REPORTS, measurementRow } = await import('../lib/journey-ga4-reports.mjs');
  const row = measurementRow({ 'customEvent:ui_action': 'tab_switch', 'customEvent:ui_target': 'table', contentGroup: 'ranking', eventCount: '4' }, MEASUREMENT_REPORTS.interactions);
  assert.deepEqual(row, { ui_action: 'tab_switch', ui_target: 'table', contentGroup: 'ranking', eventCount: '4' });
});
