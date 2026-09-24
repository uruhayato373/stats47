import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MIN_EVENTS_FOR_BREAKDOWN, parseCsv, renderCycleMarkdown, summarizeDimensionGaps, summarizeJourney, summarizeOverdue,
  summarizeWorkContext,
} from '../lib/measurement-cycle.mjs';
import { buildQuery, parseFilterExpr } from '../lib/ga4-query.mjs';

test('csv parser keeps quoted commas so page paths with commas do not shift columns', () => {
  const rows = parseCsv('landingPage,sessions\n"/blog/a,b",12\n/blog/c,3\n');
  assert.deepEqual(rows, [{ landingPage: '/blog/a,b', sessions: '12' }, { landingPage: '/blog/c', sessions: '3' }]);
});

test('journey rate divides section transitions by the source section page views, not by all PV', () => {
  const journey = summarizeJourney({
    transitions: [
      { from_section: 'blog', to_section: 'ranking', pageViews: '30' },
      { from_section: 'themes', to_section: 'ranking', pageViews: '5' },
      { from_section: 'ranking', to_section: 'ranking', pageViews: '900' },
    ],
    pagesClean: [
      { pagePath: '/blog/a', screenPageViews: '200' },
      { pagePath: '/blog/b', screenPageViews: '100' },
      { pagePath: '/themes/x', screenPageViews: '50' },
      { pagePath: '/ranking/y', screenPageViews: '5000' },
    ],
  });
  assert.equal(journey.blogToRanking.rate, 0.1);
  assert.equal(journey.themesToRanking.rate, 0.1);
  assert.equal(journey.themesToBlog.pageViews, 0);
  // 同一セクション内の遷移は「回遊の上位」に混ぜない (ranking→ranking が常に最大で他が埋もれる)
  assert.deepEqual(journey.topCrossSection.map((r) => `${r.from}>${r.to}`), ['blog>ranking', 'themes>ranking']);
});

test('work context lists only pages above the session-weighted baseline on both shares', () => {
  const { baseline, top } = summarizeWorkContext([
    { landingPage: '(not set)', sessions: '1000', desktopShare: '0.9', workdayHoursShare: '0.9' },
    { landingPage: '/blog/work', sessions: '40', desktopShare: '0.9', workdayHoursShare: '0.8' },
    { landingPage: '/blog/home-reader', sessions: '160', desktopShare: '0.2', workdayHoursShare: '0.3' },
    { landingPage: '/blog/desk-evening', sessions: '40', desktopShare: '0.9', workdayHoursShare: '0.1' },
    { landingPage: '/blog/tiny', sessions: '10', desktopShare: '1', workdayHoursShare: '1' },
  ]);
  // (not set) は着地ページが取れない session で、baseline を汚すので除外する
  assert.equal(baseline.sessions, 250);
  assert.deepEqual(top.map((r) => r.landingPage), ['/blog/work']);
});

test('dimension gaps group absent params by event and mark which have enough volume to read', () => {
  const ledgerEntries = [
    { events: ['cta_click'], required: ['cta_id', 'content_id'], optional: [], statusKind: 'needs-registration', status: '⏳要登録' },
    { events: ['home_featured_impression', 'home_featured_click'], required: ['slot'], optional: [], statusKind: 'needs-registration', status: '⏳要登録' },
    { events: ['nav_click'], required: ['nav_surface'], optional: [], statusKind: 'registered', status: '✅登録済' },
  ];
  const gaps = summarizeDimensionGaps({
    ledgerEntries,
    registeredParams: ['nav_surface'],
    eventVolume: [
      { eventName: 'home_featured_impression', eventCount: String(MIN_EVENTS_FOR_BREAKDOWN - 10) },
      { eventName: 'home_featured_click', eventCount: '10' },
      { eventName: 'cta_click', eventCount: '3' },
    ],
  });
  assert.equal(gaps.absentParams, 3);
  assert.deepEqual(gaps.groups.map((g) => [g.events.join('+'), g.eventCount28d, g.breakdownReady]), [
    ['home_featured_impression+home_featured_click', MIN_EVENTS_FOR_BREAKDOWN, true],
    ['cta_click', 3, false],
  ]);
});

test('overdue uses the week end as asOf so the same week always yields the same list', () => {
  const entries = [
    { section_id: 'A-01', status: 'effect/pending', due: '2026-09-14' },
    { section_id: 'B-01', status: 'pending', due: '2026-09-20' },
    { section_id: 'C-01', status: 'pending', due: null },
  ];
  assert.deepEqual(summarizeOverdue(entries, '2026-09-20').overdue.map((e) => e.id), ['A-01']);
});

test('markdown states missing inputs instead of printing zeros', () => {
  const md = renderCycleMarkdown({
    week: '2026-W40',
    sources: { ga4: { status: 'partial', detail: 'transitions=missing' }, customDimensions: { status: 'not-run' } },
    journey: null, workContext: null, dimensionGaps: null, improvements: { active: 0, overdue: [] },
  });
  assert.match(md, /ga4 \| partial（transitions=missing）/);
  assert.doesNotMatch(md, /blog → ranking/);
});

test('ga4-query filter mini-language maps to Data API filters and rejects ambiguous input', () => {
  assert.deepEqual(parseFilterExpr('pagePath^=/themes/'), { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/themes/' } } });
  assert.deepEqual(parseFilterExpr('customEvent:ad_id*=1330'), { filter: { fieldName: 'customEvent:ad_id', stringFilter: { matchType: 'CONTAINS', value: '1330' } } });
  assert.deepEqual(parseFilterExpr('eventName=in:a|b'), { filter: { fieldName: 'eventName', inListFilter: { values: ['a', 'b'] } } });
  assert.throws(() => parseFilterExpr('pagePath/themes'));
  assert.throws(() => buildQuery(['--dims', 'pagePath']), /--metrics/);
  const { request } = buildQuery(['--metrics', 'sessions', '--japan', '--filter', 'pagePath==/']);
  assert.equal(request.dimensionFilter.andGroup.expressions.length, 2);
  assert.deepEqual(request.dateRanges, [{ startDate: '28daysAgo', endDate: 'yesterday' }]);
});
