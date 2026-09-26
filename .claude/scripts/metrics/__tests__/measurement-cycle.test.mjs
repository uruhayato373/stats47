import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countOpsImprovements, MIN_EVENTS_FOR_BREAKDOWN, parseCsv, renderCycleMarkdown, summarizeCloudflare,
  summarizeDimensionGaps, summarizeEngine, summarizeJourney, summarizeNavCoverage, summarizeOverdue, summarizePsi, summarizeSns,
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

test('engine summary counts verdicts per domain and lists GSC rows by the markers they still lack', () => {
  const engine = summarizeEngine({
    verdicts: { week: '2026-W38', verdicts: [
      { domainId: 'gsc-blog-wave', label: 'effect/pending' },
      { domainId: 'gsc-improvement', label: 'effect/full' },
    ] },
    gscRows: [
      { id: 'A-01', hasPage: true, hasDeploy: true, hasTarget: true },
      { id: 'B-01', hasPage: true, hasDeploy: false, hasTarget: false },
    ],
  });
  assert.deepEqual(engine.byDomain['gsc-improvement'], { subjects: 1, byLabel: { 'effect/full': 1 } });
  assert.deepEqual(engine.gsc, { active: 2, judgeable: 1, missing: [{ id: 'B-01', missing: ['デプロイ済 YYYY-MM-DD', '[target: +N clicks]'] }] });
  // verdict が無い週は 0 件ではなく「未生成」と区別できる
  assert.equal(summarizeEngine({ verdicts: null, gscRows: [] }).verdictsWeek, null);
});

test('PSI rows with an empty score are measurement failures, not 0-point pages', () => {
  const row = (date, url, score, err = '0') => ({ date, url, strategy: 'mobile', score_performance: score, lcp_ms: '2000', violations_error: err });
  const psi = summarizePsi([
    row('2026-09-20', 'https://stats47.jp/a', '90'),
    row('2026-09-20', 'https://stats47.jp/b', '50', '2'),
    row('2026-09-20', 'https://stats47.jp/areas/01000', '', '1'),
    row('2026-09-21', 'https://stats47.jp/a', '10'), // asOf より後の行は今週に含めない
  ], '2026-09-20');
  assert.equal(psi.mobileMedianScore, 70);
  assert.deepEqual(psi.worstMobile.map((w) => w.score), [50, 90]);
  assert.equal(psi.measurementFailures, 1);
  assert.equal(psi.urlsWithErrors, 1);
  assert.equal(summarizePsi([row('2026-09-10', 'https://stats47.jp/a', '90')], '2026-09-20').status, 'stale');
});

test('Cloudflare counts only violations inside the 7-day window ending at the week end', () => {
  const cf = summarizeCloudflare(
    [
      { date: '2026-09-20', workers_requests: '100', workers_errors: '2', r2_class_a_ops: '1', r2_class_b_ops: '2', r2_egress_mb: '3', r2_storage_gb: '32.9' },
      { date: '2026-09-10', workers_requests: '999', workers_errors: '999', r2_class_a_ops: '0', r2_class_b_ops: '0', r2_egress_mb: '0', r2_storage_gb: '30' },
    ],
    [
      { date: '2026-09-20', violations: [{ severity: 'warning', title: 'R2 storage > 18GB' }] },
      { date: '2026-09-10', violations: [{ severity: 'critical', title: 'old' }] },
    ],
    '2026-09-20',
  );
  assert.equal(cf.workersRequests, 100);
  assert.equal(cf.workersErrorRate, 0.02);
  assert.deepEqual(cf.violationsBySeverity, { warning: 1 });
  assert.equal(cf.r2StorageGb, 32.9);
});

test('SNS keeps reach and views because Instagram no longer reports impressions', () => {
  const sns = summarizeSns([
    { platform: 'instagram', content_key: 'a', fetched_at: '2026-09-20T00:00:00Z', impressions: '', reach: '100', views: '150', likes: '3', comments: '1', shares: '0', saves: '2' },
    { platform: 'x', content_key: 'b', fetched_at: '2026-09-19T00:00:00Z', impressions: '40', likes: '1' },
  ]);
  assert.deepEqual(sns.platforms.instagram, { posts: 1, impressions: 0, reach: 100, views: 150, engagements: 6 });
  assert.equal(sns.latestDate, '2026-09-20');
  assert.deepEqual(countOpsImprovements([{ section_id: 'P-01', target_metric: 'performance' }, { section_id: 'C-01', target_metric: 'cloudflare-cost' }]),
    { psi: ['P-01'], cloudflare: ['C-01'], sns: [] });
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

// NAV-CLICK-COVERAGE-01 P4 (2026-09-26): 分母は計装に依らないサイト内の移動、分子は導線名の付いたクリック
test('nav coverage divides labeled nav clicks by internal transitions and ranks unlabeled destinations', () => {
  const nav = summarizeNavCoverage({
    transitions: [{ from_section: 'blog', to_section: 'ranking', pageViews: '600' }, { from_section: 'ranking', to_section: 'ranking', pageViews: '400' }],
    navClicks: [
      { nav_surface: 'desktop-header', nav_label: 'ランキング', eventCount: '200' },
      { nav_surface: 'unlabeled', nav_label: 'ranking', eventCount: '150' },
      { nav_surface: 'unlabeled', nav_label: 'areas', eventCount: '50' },
    ],
  });
  assert.equal(nav.internalTransitions, 1000);
  assert.equal(nav.labeledClicks, 200);
  assert.equal(nav.coverage, 0.2);
  assert.equal(nav.unlabeledShare, 0.5);
  assert.deepEqual(nav.topUnlabeled.map((r) => r.label), ['ranking', 'areas']);
});
