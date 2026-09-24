import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGscImprovementsAdapter, extractGscPages, judgeability, sumPages } from '../lib/gsc-improvements-adapter.mjs';
import { buildGscQuery, parseGscFilter } from '../lib/gsc-query.mjs';
import { decideVerdict } from '../../lib/effect-verdict/engine.mjs';
import { runAdapter } from '../../lib/effect-verdict/cli.mjs';
import { DEFAULT_THRESHOLDS } from '../../lib/effect-verdict/thresholds.mjs';

const pages = {
  '2026-W30': [
    { page: 'https://stats47.jp/themes/local-finance', clicks: '40', impressions: '900' },
    { page: 'https://stats47.jp/themes/local-finance#kpi', clicks: '0', impressions: '100' },
    { page: 'https://stats47.jp/themes/local-finance-other', clicks: '5', impressions: '50' },
    { page: 'https://stats47.jp/blog/x', clicks: '999', impressions: '9999' },
  ],
  '2026-W36': [
    { page: 'https://stats47.jp/themes/local-finance', clicks: '130', impressions: '2000' },
    { page: 'https://stats47.jp/themes/local-finance#kpi', clicks: '0', impressions: '200' },
  ],
};
const entry = (id, title, metric = 'gsc') => ({ section_id: id, title, target_metric: metric, status: 'effect/pending' });
const adapterFor = (entries) => createGscImprovementsAdapter({
  entries,
  availableWeeks: Object.keys(pages).sort(),
  loadPages: (w) => pages[w] ?? [],
  minWeeks: DEFAULT_THRESHOLDS.window.minWeeks,
  logPath: '/dev/null',
});

test('only GSC rows that name their pages become subjects; prose is never parsed into a scope', () => {
  const adapter = adapterFor([
    entry('A-01', 'テーマ改善 [gsc-page: /themes/local-finance] デプロイ済 2026-08-01 [target: +60 clicks]'),
    entry('B-01', 'ページ名だけ散文にある /themes/local-finance の改善 デプロイ済 2026-08-01'),
    entry('C-01', 'GA4 施策 [gsc-page: /themes/x]', 'ga4'),
  ]);
  assert.deepEqual(adapter.listSubjects().map((s) => s.subjectId), ['A-01']);
  assert.deepEqual(extractGscPages('[gsc-page: /a] と [gsc-page: /b] と [gsc-page: /a]'), ['/a', '/b']);
});

test('page matching is a path prefix that includes #fragment rows, like the blog-wave adapter', () => {
  // GSC は見出しアンカー付き URL を別行で返す。同じページの表示なので合計に含める
  assert.deepEqual(sumPages(pages['2026-W30'], ['/themes/local-finance']), { clicks: 45, impressions: 1050 });
  assert.deepEqual(sumPages(pages['2026-W30'], ['/themes/local-finance#']), { clicks: 0, impressions: 0 });
});

test('a marked subject reaches a confirmed label when the target is met (fixed clock)', () => {
  const adapter = adapterFor([entry('A-01', '[gsc-page: /themes/local-finance/] デプロイ済 2026-08-01 [target: +60 clicks]')]);
  // 末尾スラッシュ付きは一致しない (前方一致なので /themes/local-finance/ は /themes/local-finance に当たらない)
  assert.equal(adapter.measure(adapter.listSubjects()[0], '2026-W36').value, 0);

  const ok = adapterFor([entry('A-01', '[gsc-page: /themes/local-finance] デプロイ済 2026-08-01 [target: +60 clicks]')]);
  const [subject] = ok.listSubjects();
  const window = ok.resolveWindow(subject);
  assert.deepEqual([window.beforeWeek, window.afterWeek, window.notDue], ['2026-W30', '2026-W36', false]);
  const before = ok.measure(subject, window.beforeWeek);
  const after = ok.measure(subject, window.afterWeek);
  const verdict = decideVerdict({
    before: { value: before.value, impressions: before.impressions },
    after: { value: after.value, impressions: after.impressions },
    target: ok.targetOf(subject),
    window,
    sources: ok.sourcesOf(subject, window),
    confounders: {},
    now: '2026-09-08T00:00:00Z',
  });
  // 40→130 (+90) / 想定 +60 → 達成率 150% ≥ full 境界 0.8
  assert.equal(verdict.label, 'effect/full');
  assert.match(ok.reproduceCommand(subject), /gsc-query\.mjs --start \d{4}-\d{2}-\d{2} --end \d{4}-\d{2}-\d{2} --dims page --filter 'page\*=\/themes\/local-finance'/);
});

test('a subject without a deploy date stays pending instead of guessing a window', () => {
  const adapter = adapterFor([entry('A-01', '[gsc-page: /themes/local-finance] [target: +60 clicks]')]);
  const [v] = runAdapter(adapter);
  assert.equal(v.label, 'effect/pending');
  assert.equal(v.skipped, true);
});

test('judgeability reports which of the three markers a row is missing', () => {
  assert.deepEqual(judgeability(entry('A-01', '[gsc-page: /a] デプロイ済 2026-08-01')), {
    id: 'A-01', metric: 'gsc', hasPage: true, hasDeploy: true, hasTarget: false,
  });
});

test('gsc-query accepts only operators the Search Console API has', () => {
  assert.deepEqual(parseGscFilter('page!*=/blog/'), { dimension: 'page', operator: 'notContains', expression: '/blog/' });
  assert.deepEqual(parseGscFilter('query~=^地方債'), { dimension: 'query', operator: 'includingRegex', expression: '^地方債' });
  assert.throws(() => parseGscFilter('date==2026-09-01'), /dimension/);
  assert.throws(() => buildGscQuery(['--dims', 'page']), /必須/);
  const { request } = buildGscQuery(['--start', '2026-09-11', '--end', '2026-09-17', '--dims', 'query,page', '--filter', 'page*=/themes/']);
  assert.deepEqual(request.dimensionFilterGroups, [{ groupType: 'and', filters: [{ dimension: 'page', operator: 'contains', expression: '/themes/' }] }]);
});
