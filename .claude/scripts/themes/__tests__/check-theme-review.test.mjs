import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, evidenceFilePath } from '../check-theme-review.mjs';

const input = {
  observedAt: '2026-09-18',
  reviewInputSha256: 'current-evidence',
};
const before = {
  version: 1,
  experiments: [
    {
      themeKey: 'test-theme',
      startedAt: '2026-09-11',
      baseline: { period: 'original' },
      evaluateAt: { d7: '2026-09-18', d56: '2026-11-06' },
      verdict: 'pending',
      result: { d7: { status: 'insufficient-data' } },
    },
  ],
};
const report = {
  schemaVersion: 1,
  inputSha256: input.reviewInputSha256,
  reviewedAt: input.observedAt,
  month: '2026-09',
  status: 'no-change',
  summary: '期間不足のため次の判定日まで観測する',
  findings: [],
  sourceReviews: [],
  unreviewedThemes: ['test-theme'],
  tests: [],
};
const record = '.claude/state/themes/ci-review.json';
test('review-only record does not imply a code change or PR', () => {
  assert.deepEqual(validateReview(report, input, [record], before, before), {
    codeChanged: false,
    proposalChanges: false,
  });
});
test('code and experiment decisions are reviewable proposals', () => {
  assert.deepEqual(
    validateReview(
      { ...report, status: 'proposed' },
      input,
      [record, 'apps/web/src/features/theme-dashboard/test.ts'],
      before,
      before
    ),
    { codeChanged: true, proposalChanges: true }
  );
  const after = structuredClone(before);
  after.experiments[0].verdict = 'insufficient-data';
  assert.deepEqual(
    validateReview(
      { ...report, reviewedAt: '2026-11-06', month: '2026-11' },
      { ...input, observedAt: '2026-11-06' },
      [record, '.claude/state/themes/experiments.json'],
      before,
      after
    ),
    { codeChanged: false, proposalChanges: true }
  );
});
test('the reviewer cannot alter its guards or unrelated files', () => {
  for (const file of [
    '.github/workflows/theme-chart-audit-weekly.yml',
    'package.json',
    '.claude/scripts/themes/check-theme-review.mjs',
    '.claude/scripts/themes/validate-theme-state.mjs',
    '.claude/scripts/themes/theme-followup-core.mjs',
  ]) {
    assert.throws(
      () => validateReview(report, input, [file], before, before),
      /Disallowed/
    );
  }
});
test('review cannot reset baseline, observations, dates or schema', () => {
  for (const mutate of [
    (a) => (a.version = 2),
    (a) => (a.experiments[0].baseline.period = 'new'),
    (a) => (a.experiments[0].startedAt = '2026-09-18'),
    (a) => (a.experiments[0].result.d7.status = 'ok'),
  ]) {
    const after = structuredClone(before);
    mutate(after);
    assert.throws(
      () => validateReview(report, input, [record], before, after),
      /immutable/
    );
  }
});
test('old evidence and invented theme keys are rejected', () => {
  assert.throws(() =>
    validateReview(
      { ...report, inputSha256: 'stale' },
      input,
      [record],
      before,
      before
    )
  );
  assert.throws(
    () =>
      validateReview(
        { ...report, unreviewedThemes: ['invented'] },
        input,
        [record],
        before,
        before
      ),
    /Unknown theme/
  );
});

test('d7 low sample cannot close an experiment before d28 and d56 measurement', () => {
  const after = structuredClone(before);
  after.experiments[0].verdict = 'insufficient-data';
  assert.throws(
    () =>
      validateReview(
        report,
        input,
        [record, '.claude/state/themes/experiments.json'],
        before,
        after
      ),
    /Only due d56/
  );
});

test('placeholder evidence and unsupported complete source coverage are rejected', () => {
  for (const bad of [
    { ...report, summary: 'test' },
    { ...report, findings: [{ themeKey: 'test-theme', detail: 'test', evidenceRefs: ['a'] }] },
    { ...report, findings: [{ themeKey: 'test-theme', detail: '実際の検査結果', evidenceRefs: ['a'] }] },
    { ...report, unreviewedThemes: [] },
    { ...report, sourceReviews: [{ themeKey: 'test-theme', detail: '公式資料確認済み', evidenceRefs: ['.local/runtime.json'] }] },
  ]) assert.throws(() => validateReview(bad, input, [record], before, before));
});

test('file evidence supports line numbers without treating them as a filename', () => {
  assert.equal(evidenceFilePath('.local/ci/theme-followup/runtime.json:7492-7650'), '.local/ci/theme-followup/runtime.json');
  assert.equal(evidenceFilePath('packages/config.ts#L12-L18'), 'packages/config.ts');
  assert.equal(evidenceFilePath('.claude/state/themes/quality.json'), '.claude/state/themes/quality.json');
});
