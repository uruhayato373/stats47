import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  addIsoWeeks,
  auditOperationsCycle,
  renderMarkdown,
} from '../audit-operations-cycle.mjs';

const NOW = new Date('2026-08-24T12:00:00.000Z');
const POLICY = {
  urlInspectionMaxAgeDays: 3,
  searchGrowthMaxAgeDays: 8,
  minimumCandidateDecisionsPerWeek: 1,
  minimumReviewsInTrailingFourWeeks: 3,
  requiredMonthlyHeading: '## GSC運用サイクル',
  legacyMissingTargetSubjectIds: ['LEGACY-WAVE'],
};

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    typeof content === 'string'
      ? content
      : `${JSON.stringify(content, null, 2)}\n`
  );
}

function fixture({
  decision = true,
  targetSubject = null,
  confirmedActive = false,
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-cycle-'));
  write(
    root,
    '.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W34/summary.json',
    {
      finalized7d: { coverage: { status: 'complete' } },
      wowBlockedReason: null,
    }
  );
  write(root, '.claude/state/effect-verdict/verdicts-2026-W34.json', {
    week: '2026-W34',
    summary: { total: targetSubject || confirmedActive ? 1 : 0 },
    verdicts: [
      ...(targetSubject
        ? [
            {
              domainId: 'gsc-blog-wave',
              subjectId: targetSubject,
              label: 'effect/pending',
              guards: [{ code: 'insufficient-target' }],
            },
          ]
        : []),
      ...(confirmedActive
        ? [
            {
              domainId: 'gsc-blog-wave',
              subjectId: 'CONFIRMED-WAVE',
              label: 'effect/full',
              guards: [],
            },
          ]
        : []),
    ],
  });
  write(root, '.claude/state/search-growth/candidates.json', {
    generatedAt: '2026-08-23T13:00:00.000Z',
    week: '2026-W34',
    sourceHealth: {
      gsc: { status: 'success', freshness: 'fresh' },
      coverage: { status: 'success', freshness: 'fresh' },
      inspection: { status: 'partial', freshness: 'fresh' },
    },
    candidates: [
      {
        id: 'C-1',
        status: decision ? 'dismissed' : 'pending',
        ...(decision ? { dismissedAt: '2026-08-24T01:00:00.000Z' } : {}),
      },
    ],
  });
  write(
    root,
    '.claude/state/metrics/gsc/url-inspection/LATEST.md',
    '# GSC URL Inspection — 2026-08-22\n'
  );
  for (const week of ['2026-W31', '2026-W32', '2026-W33', '2026-W34']) {
    write(
      root,
      `.claude/skills/management/weekly-review/reference/reviews/${week}.md`,
      `# ${week}\n\n## search-growth 候補\n`
    );
  }
  write(
    root,
    '.claude/todo/weekly.md',
    '---\ntype: weekly-plan\nweek: 2026-W35\n---\n'
  );
  write(
    root,
    '.claude/todo/monthly.md',
    '---\ntype: monthly-plan\nmonth: 2026-08\n---\n\n## GSC運用サイクル\n'
  );
  write(
    root,
    '.claude/todo/improvements.md',
    confirmedActive ? '| CONFIRMED-WAVE | active |\n' : ''
  );
  return root;
}

test('ISO週の加算は年境界を正しく扱う', () => {
  assert.equal(addIsoWeeks('2026-W53', 1), '2027-W01');
  assert.equal(addIsoWeeks('2026-W01', -1), '2025-W52');
});

test('日本時間の月曜はUTCで日曜でも直前週を監査対象にする', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: new Date('2026-08-23T15:01:00.000Z'),
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(result.expectedCompletedWeek, '2026-W34');
  assert.equal(
    result.checks.find((item) => item.code === 'snapshot-freshness')?.level,
    'pass'
  );
});

test('全工程が接続されていれば monitor は pass', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(result.status, 'pass');
  assert.equal(result.measurementWeek, '2026-W34');
  assert.equal(result.expectedPlanWeek, '2026-W35');
  assert.match(renderMarkdown(result), /Status\*\*: PASS/);
});

test('最新計測に対応するreviewと次週planの欠落をfailにする', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.rmSync(
    path.join(
      root,
      '.claude/skills/management/weekly-review/reference/reviews/2026-W34.md'
    )
  );
  write(root, '.claude/todo/weekly.md', '---\nweek: 2026-W34\n---\n');
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(result.status, 'fail');
  assert.equal(
    result.checks.find((item) => item.code === 'weekly-review')?.level,
    'fail'
  );
  assert.equal(
    result.checks.find((item) => item.code === 'weekly-plan')?.level,
    'fail'
  );
});

test('候補がある週はapproveまたはdismissを最低1件要求する', (t) => {
  const root = fixture({ decision: false });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'review',
    policy: POLICY,
  });
  assert.equal(
    result.checks.find((item) => item.code === 'search-growth-decision')?.level,
    'fail'
  );
});

test('前週候補の月曜レビューは有効、過去週の判断は無効にする', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidatesPath = path.join(
    root,
    '.claude/state/search-growth/candidates.json'
  );
  const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  candidates.candidates[0].dismissedAt = '2026-08-16T01:00:00.000Z';
  write(root, '.claude/state/search-growth/candidates.json', candidates);
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'review',
    policy: POLICY,
  });
  assert.equal(
    result.checks.find((item) => item.code === 'search-growth-decision')?.level,
    'fail'
  );
});

test('既知のtarget欠落はwarn、新規欠落はfailにするラチェット', (t) => {
  const legacyRoot = fixture({ targetSubject: 'LEGACY-WAVE' });
  const newRoot = fixture({ targetSubject: 'NEW-WAVE' });
  t.after(() => fs.rmSync(legacyRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(newRoot, { recursive: true, force: true }));
  const legacy = auditOperationsCycle({
    root: legacyRoot,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  const added = auditOperationsCycle({
    root: newRoot,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(
    legacy.checks.find((item) => item.code === 'effect-target-ratchet')?.level,
    'warn'
  );
  assert.equal(
    added.checks.find((item) => item.code === 'effect-target-ratchet')?.level,
    'fail'
  );
});

test('確定verdictがactive一覧に残ったらtriage漏れとしてfail', (t) => {
  const root = fixture({ confirmedActive: true });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(
    result.checks.find((item) => item.code === 'effect-backlog-reconciliation')
      ?.level,
    'fail'
  );
});

test('review-inputはレビュー作成前なのでreviewとplanを要求しない', (t) => {
  const root = fixture({ decision: false });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.rmSync(
    path.join(
      root,
      '.claude/skills/management/weekly-review/reference/reviews/2026-W34.md'
    )
  );
  fs.rmSync(path.join(root, '.claude/todo/weekly.md'));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'review-input',
    policy: POLICY,
  });
  assert.equal(
    result.checks.some((item) => item.code === 'weekly-review'),
    false
  );
  assert.equal(
    result.checks.some((item) => item.code === 'weekly-plan'),
    false
  );
  assert.equal(result.status, 'pass');
});

test('snapshotが無いmonthly監査は例外にせずfailを返す', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-cycle-empty-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'monthly',
    policy: POLICY,
  });
  assert.equal(result.status, 'fail');
  assert.equal(
    result.checks.find((item) => item.code === 'snapshot-missing')?.level,
    'fail'
  );
  assert.equal(
    result.checks.find((item) => item.code === 'effect-verdict')?.level,
    'fail'
  );
});
