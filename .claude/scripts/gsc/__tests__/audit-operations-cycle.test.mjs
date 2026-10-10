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
import { isAnchorRow } from '../analyze-ctr-seesaw.mjs';

const NOW = new Date('2026-08-24T12:00:00.000Z');
const REPO_ROOT = process.cwd();
const PAGE_CSV_CONSUMERS = [
  'blog/build-remediation-queue.mjs',
  'ai-content/build-ai-content-queue.mjs',
  'blog/analyze-winning-patterns.mjs',
  'gsc/extract-low-ctr-ranking-pages.mjs',
  'ads/build-placement-map.mjs',
];
const POLICY = {
  urlInspectionMaxAgeDays: 3,
  searchGrowthMaxAgeDays: 8,
  minimumCandidateDecisionsPerWeek: 1,
  minimumReviewsInTrailingFourWeeks: 3,
  requiredMonthlyHeading: '## GSC運用サイクル',
  legacyMissingTargetSubjectIds: ['LEGACY-WAVE'],
};

test('fragment URL だけを GSC アンカー行と判定する', () => {
  assert.equal(
    isAnchorRow('https://stats47.jp/ranking/population#table'),
    true
  );
  assert.equal(
    isAnchorRow('https://stats47.jp/ranking/population?pref=13'),
    false
  );
});

test('pages.csv の5 consumerが共通のアンカー判定を使う', () => {
  for (const relativePath of PAGE_CSV_CONSUMERS) {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, '.claude/scripts', relativePath),
      'utf8'
    );
    assert.match(source, /import \{ isAnchorRow \} from /, relativePath);
    assert.match(source, /isAnchorRow\(/, relativePath);
  }
});

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
  candidateWeek = '2026-W34',
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-cycle-'));
  write(
    root,
    'data/gsc/snapshots/2026-W34/summary.json',
    {
      finalized7d: { coverage: { status: 'complete' } },
      wowBlockedReason: null,
    }
  );
  write(root, 'data/effect-verdict/verdicts-2026-W34.json', {
    week: candidateWeek,
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
  write(root, 'data/search-growth/candidates.json', {
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
    'data/gsc/url-inspection/LATEST.md',
    '# GSC URL Inspection — 2026-08-22\n'
  );
  for (const week of ['2026-W31', '2026-W32', '2026-W33', '2026-W34']) {
    write(
      root,
      `data/reviews/weekly/${week}.md`,
      `# ${week}\n\n## search-growth 候補\n`
    );
  }
  write(
    root,
    '.claude/todo/weekly.md',
    // 2026-10-10 から土曜にレビューと来週の計画を書く。W34 の計測を受けた計画は W35 の土曜に書く W36
    '---\ntype: weekly-plan\nweek: 2026-W36\n---\n'
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
  assert.equal(result.expectedPlanWeek, '2026-W36');
  assert.match(renderMarkdown(result), /Status\*\*: PASS/);
});

test('月曜に再構築した次週cadenceの候補も前週レビュー入力として扱う', (t) => {
  const root = fixture({ candidateWeek: '2026-W35' });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = auditOperationsCycle({
    root,
    now: NOW,
    stage: 'monitor',
    policy: POLICY,
  });
  assert.equal(
    result.checks.find((item) => item.code === 'search-growth-freshness')
      ?.level,
    'pass'
  );
});

test('土曜運用: 金曜に作った候補と土曜の判断を計測週のサイクルとして扱い、次の計画は 2 週先を求める', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // 金曜 06:30 JST に候補を作り直し (週ラベルは実行週 W35)、土曜にレビューで判断した
  write(root, 'data/search-growth/candidates.json', {
    generatedAt: '2026-08-27T21:30:00.000Z',
    week: '2026-W35',
    sourceHealth: {
      gsc: { status: 'success', freshness: 'fresh' },
      coverage: { status: 'success', freshness: 'fresh' },
      inspection: { status: 'success', freshness: 'fresh' },
    },
    candidates: [{ id: 'C-1', status: 'dismissed', dismissedAt: '2026-08-29T03:00:00.000Z' }],
  });
  write(root, 'data/gsc/url-inspection/LATEST.md', '# GSC URL Inspection — 2026-08-29\n');
  // 日曜 20:30 JST の monitor
  const now = new Date('2026-08-30T11:30:00.000Z');
  const result = auditOperationsCycle({ root, now, stage: 'monitor', policy: POLICY });
  assert.equal(result.expectedPlanWeek, '2026-W36');
  for (const code of ['search-growth-freshness', 'search-growth-decision', 'weekly-plan']) {
    assert.equal(result.checks.find((item) => item.code === code)?.level, 'pass', code);
  }
  // 計画が計測週の翌週 (W35) のままなら、土曜の計画が書かれていないので fail
  write(root, '.claude/todo/weekly.md', '---\nweek: 2026-W35\n---\n');
  const stale = auditOperationsCycle({ root, now, stage: 'monitor', policy: POLICY });
  assert.equal(stale.checks.find((item) => item.code === 'weekly-plan')?.level, 'fail');
});

test('判定不能のまま終了した wave (closed-waves.json) は想定効果値の欠落に数えない', (t) => {
  const root = fixture({ targetSubject: 'BLOG-WAVE-2026-05-23-manual' });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const policy = { ...POLICY, legacyMissingTargetSubjectIds: [] };
  // 終了の台帳が無ければ新規の欠落として fail
  const before = auditOperationsCycle({ root, now: NOW, stage: 'monitor', policy });
  assert.equal(before.checks.find((item) => item.code === 'effect-target-ratchet')?.level, 'fail');
  // 理由付きで終了すると数えない
  write(root, 'data/improvement/gsc-improvement/closed-waves.json', {
    closures: [{ waveId: '2026-05-23-manual', closedAt: '2026-10-10', decidedBy: 'owner', reason: '切り分け不能' }],
  });
  const after = auditOperationsCycle({ root, now: NOW, stage: 'monitor', policy });
  assert.equal(after.checks.find((item) => item.code === 'effect-target-ratchet')?.level, 'pass');
  // 理由の無い行は終了として扱わない
  write(root, 'data/improvement/gsc-improvement/closed-waves.json', {
    closures: [{ waveId: '2026-05-23-manual', closedAt: '2026-10-10' }],
  });
  const noReason = auditOperationsCycle({ root, now: NOW, stage: 'monitor', policy });
  assert.equal(noReason.checks.find((item) => item.code === 'effect-target-ratchet')?.level, 'fail');
});

test('最新計測に対応するreviewと次週planの欠落をfailにする', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.rmSync(
    path.join(
      root,
      'data/reviews/weekly/2026-W34.md'
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
    'data/search-growth/candidates.json'
  );
  const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  candidates.candidates[0].dismissedAt = '2026-08-16T01:00:00.000Z';
  write(root, 'data/search-growth/candidates.json', candidates);
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
      'data/reviews/weekly/2026-W34.md'
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
