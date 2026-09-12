import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planFollowup,
  runtimeFindings,
  summarizeFollowup,
  needsEvidenceReview,
  expectedSectionPanels,
  withinDeadline,
} from '../theme-followup-core.mjs';

const experiment = {
  experimentId: 'launch-one',
  themeKey: 'one',
  verdict: 'pending',
  evaluateAt: { d7: '2026-09-18', d28: '2026-10-09', d56: '2026-11-06' },
  result: null,
};
test('Friday checkpoint runs without waiting for Monday; dates and baseline remain unchanged', () => {
  const input = [structuredClone(experiment)],
    before = structuredClone(input);
  assert.equal(planFollowup(input, '2026-09-17').run, false);
  assert.deepEqual(planFollowup(input, '2026-09-18').due, [
    { experimentId: 'launch-one', checkpoint: 'd7', date: '2026-09-18' },
  ]);
  assert.deepEqual(input, before);
});
test('already observed checkpoint does not cause an expensive audit every day', () => {
  const e = { ...experiment, result: { d7: { status: 'quality-only' } } };
  assert.equal(planFollowup([e], '2026-09-19').run, false);
  assert.equal(planFollowup([e], '2026-09-21').run, true);
  assert.equal(planFollowup([e], '2026-10-01').monthly, true);
  assert.equal(planFollowup([e], '2026-09-19', true).run, true);
});
const good = () => ({
  http: 200,
  htmlClosed: true,
  htmlIntegrity: 'complete',
  h1: ['Population'],
  sections: [{ key: 'overview', count: 1 }],
  cards: [{ state: 'ready' }],
  charts: [{ key: 'chart', state: 'ready', type: 'line-chart', text: '' }],
  pageErrors: [],
  networkErrors: [],
  width: 390,
  scrollWidth: 390,
  selectors: 1,
});
test('200 is not enough: incomplete HTML, a missing chapter, and failed chart are errors', () => {
  assert.deepEqual(runtimeFindings(good()), []);
  assert.ok(
    runtimeFindings({ ...good(), htmlClosed: false }).includes(
      'incomplete-html'
    )
  );
  assert.ok(
    runtimeFindings({
      ...good(),
      sections: [{ key: 'overview', count: 0 }],
    }).includes('section:overview:0')
  );
  assert.ok(
    runtimeFindings({
      ...good(),
      charts: [{ key: 'chart', state: 'source-unavailable' }],
    }).includes('chart:chart:source-unavailable')
  );
});
test('intentional prefecture prompts pass, HTTP errors do not disappear after chart recovery', () => {
  assert.deepEqual(
    runtimeFindings({
      ...good(),
      charts: [
        {
          key: 'cpi',
          state: 'no-data',
          type: 'cpi-profile',
          text: '都道府県を選択してください',
        },
      ],
    }),
    []
  );
  assert.ok(
    runtimeFindings({
      ...good(),
      networkErrors: [{ status: 503, url: 'https://stats47.jp/themes/one' }],
    }).includes('network:503')
  );
  assert.ok(
    runtimeFindings({ ...good(), pageErrors: ['Connection closed'] }).includes(
      'js:Connection closed'
    )
  );
});
test('failed/incomplete browser run cannot be reported as a successful follow-up', () => {
  const result = summarizeFollowup({
    experiments: [experiment],
    quality: { summary: { themes: 1, errors: 0 } },
    runtime: { summary: { expected: 2, checked: 1, failed: 0 } },
    codes: { quality: 0, runtime: 124, live: 0 },
    today: '2026-09-18',
  });
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.includes('runtime-process:124'));
  assert.ok(result.problems.includes('runtime-incomplete'));
});
test('insufficient measurement stays pending and unchanged recurring findings produce a stable alert', () => {
  const input = {
    experiments: [
      {
        ...experiment,
        result: {
          d7: { status: 'quality-only' },
          d28: {
            status: 'insufficient-data',
            reasons: ['complete-window-unavailable'],
          },
        },
      },
    ],
    quality: { summary: { themes: 1, errors: 0 } },
    runtime: {
      summary: { expected: 2, checked: 2, failed: 0 },
      cases: [1440, 390].map((width) => ({
        themeKey: 'one',
        width,
        findings: [],
        pass: true,
      })),
    },
    codes: { quality: 0, runtime: 0, live: 0 },
    today: '2026-10-10',
  };
  const a = summarizeFollowup(input),
    b = summarizeFollowup({ ...input, today: '2026-10-11' });
  assert.equal(a.status, 'pass');
  assert.equal(a.checkpoints[1].status, 'insufficient-data');
  assert.equal(a.alertBody, b.alertBody);
  assert.equal(input.experiments[0].verdict, 'pending');
});

test('missing rendered cards or charts cannot pass as an empty list', () => {
  const findings = runtimeFindings({
    sections: [{ key: 'overview', count: 1, expectedCards: 2, cards: 1 }],
    expectedChartKeys: ['trend'],
    charts: [],
  });
  assert.ok(findings.includes('section-cards:overview:1/2'));
  assert.ok(findings.includes('missing-chart:trend'));
});

test('a passing canary cannot be recorded as a complete all-theme audit', () => {
  const result = summarizeFollowup({
    experiments: [],
    quality: { summary: { themes: 55, errors: 0 } },
    runtime: {
      summary: { expected: 2, checked: 2, failed: 0 },
      cases: [1440, 390].map((width) => ({
        themeKey: 'one',
        width,
        findings: [],
        pass: true,
      })),
    },
    codes: { runtime: 0, quality: 0, live: 0 },
    today: '2026-09-12',
  });
  assert.equal(result.status, 'fail');
  assert.ok(result.problems.includes('runtime-incomplete'));
});

test('unchanged reviewed evidence stays quiet but unfinished source checks resume', () => {
  const result = { reviewInputSha256: 'same' };
  assert.equal(
    needsEvidenceReview(result, { inputSha256: 'same', unreviewedThemes: [] }),
    false
  );
  assert.equal(
    needsEvidenceReview(result, {
      inputSha256: 'same',
      unreviewedThemes: ['one'],
    }),
    true
  );
  assert.equal(
    needsEvidenceReview(result, { inputSha256: 'old', unreviewedThemes: [] }),
    true
  );
});

test('fixed-year comparison tables count separately from switcher cards and must contain rows', () => {
  const expected = expectedSectionPanels(
    {
      metricGroups: [
        { key: 'fixed', comparisonYear: '2023' },
        { key: 'latest' },
      ],
    },
    { metricGroupKeys: ['fixed', 'latest'] }
  );
  assert.deepEqual(expected, {
    expectedCards: 1,
    expectedFixedYears: ['2023'],
  });
  const section = {
    key: 'overview',
    count: 1,
    cards: 1,
    ...expected,
    fixedTables: [{ year: '2023', rows: 47 }],
  };
  assert.deepEqual(runtimeFindings({ ...good(), sections: [section] }), []);
  for (const fixedTables of [
    [],
    [{ year: '2022', rows: 47 }],
    [{ year: '2023', rows: 0 }],
  ])
    assert.ok(
      runtimeFindings({
        ...good(),
        sections: [{ ...section, fixedTables }],
      }).includes('fixed-year-tables:overview')
    );
});

test('an unfinished response body cannot hold the entire browser audit open', async () => {
  assert.equal(
    await withinDeadline(Promise.resolve('body'), 50, 'timeout'),
    'body'
  );
  await assert.rejects(
    withinDeadline(new Promise(() => {}), 5, 'response-body-timeout'),
    /response-body-timeout/
  );
});
