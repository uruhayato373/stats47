'use strict';

/**
 * main pinned な workflow への dispatch を、main 未反映のまま投げるのを止める検査。
 *
 * 主役のケースは **2026-08-17 に実際にやった手順の再現**。ここが緑のままだと
 * 「再生成は成功したのに本番が変わらない」を何度でも繰り返す。
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isRelevantPath,
  evaluateRequest,
  checkDispatchFreshness,
} = require('../check-dispatch-freshness.cjs');

/** 2026-08-17 20:02 に実際に commit した request (これが通ってしまった) */
const INCIDENT_REQUEST = {
  workflow: 'sync-snapshots.yml',
  inputs: { only: 'ranking-items' },
  ref: 'develop',
  reason: 'seoTitle 是正を item.json へ反映する',
  requestedAt: '2026-08-17T20:02:00Z',
};

/** そのとき develop にあって main に無かったもの */
const INCIDENT_DIVERGED = [
  'packages/data-configs/src/metrics/divorces-per-total-population.ts',
  'packages/data-configs/src/metrics/marriages-per-total-population.ts',
  'packages/ranking/src/config/gone-ranking-keys.ts',
];

test('★2026-08-17 の事故を再現して止める', () => {
  const r = evaluateRequest({
    request: INCIDENT_REQUEST,
    mainPinned: true,
    divergedPaths: INCIDENT_DIVERGED,
  });
  assert.equal(r.ok, false, 'あの日の手順が通ってしまう — この検査の存在理由そのもの');
  assert.equal(r.code, 'MAIN_LAG');
  assert.equal(r.blockingPaths.length, 3);
  // 「何をすれば直るか」が出ないと次の人が同じところで止まる
  assert.match(r.message, /develop→main/);
});

test('main pinned でない workflow は対象外', () => {
  const r = evaluateRequest({
    request: { workflow: 'publish-blog.yml' },
    mainPinned: false,
    divergedPaths: INCIDENT_DIVERGED,
  });
  assert.equal(r.ok, true);
});

test('main が develop に追いついていれば通る', () => {
  const r = evaluateRequest({
    request: INCIDENT_REQUEST,
    mainPinned: true,
    divergedPaths: [],
  });
  assert.equal(r.ok, true);
});

/**
 * ★非検出テスト。通常運用でここが鳴ると `--no-verify` で外され、検査ごと死ぬ。
 * 検体は 2026-08-17 20:45 時点の実際の `origin/main...origin/develop` (5 ファイル)。
 */
test('state / docs だけの乖離では鳴らない (実測の通常状態)', () => {
  const r = evaluateRequest({
    request: INCIDENT_REQUEST,
    mainPinned: true,
    divergedPaths: [
      '.claude/state/ai-content/queue.json',
      '.claude/state/ai-content/LATEST.md',
      '.claude/state/metrics/claude-usage/history.csv',
      '.claude/todo/05_機能バックログ.md',
      '.github/workflows/sync-snapshots.yml',
    ],
  });
  assert.equal(r.ok, true, '通常状態で鳴ると検査が運用で外される');
});

test('テスト・README の変更では鳴らない (生成結果に影響しない)', () => {
  const r = evaluateRequest({
    request: INCIDENT_REQUEST,
    mainPinned: true,
    divergedPaths: [
      'packages/ranking/src/__tests__/foo.test.ts',
      'packages/data-configs/src/metrics/__tests__/bar.test.ts',
      'packages/ranking/README.md',
    ],
  });
  assert.equal(r.ok, true);
});

test('acknowledgedMainLag で明示的に上書きできる (理由が要る)', () => {
  const withReason = evaluateRequest({
    request: { ...INCIDENT_REQUEST, acknowledgedMainLag: 'blog task は config を読まないため' },
    mainPinned: true,
    divergedPaths: INCIDENT_DIVERGED,
  });
  assert.equal(withReason.ok, true);
  assert.match(withReason.acknowledged, /config を読まない/);

  // 空・短すぎる理由は上書きとして認めない (チェックを黙らせるだけの記入を防ぐ)
  for (const ack of ['', '   ', 'ok', true, 1]) {
    const r = evaluateRequest({
      request: { ...INCIDENT_REQUEST, acknowledgedMainLag: ack },
      mainPinned: true,
      divergedPaths: INCIDENT_DIVERGED,
    });
    assert.equal(r.ok, false, `理由 ${JSON.stringify(ack)} で上書きできてしまう`);
  }
});

test('isRelevantPath: 生成入力とそれ以外を分ける', () => {
  for (const p of [
    'packages/data-configs/src/metrics/x.ts',
    'packages/ranking/src/scripts/generate-ranking-items.ts',
    'apps/web/scripts/export-blog-snapshot.ts',
    '.claude/skills/db/sync-snapshots/run.sh',
  ]) {
    assert.equal(isRelevantPath(p), true, `${p} が入力扱いされない`);
  }
  for (const p of [
    '.claude/todo/05_機能バックログ.md',
    '.claude/state/ai-content/queue.json',
    '.github/workflows/sync-snapshots.yml',
    'data/workflow-dispatch-requests.json',
    'packages/ranking/src/__tests__/x.test.ts',
    'apps/web/src/app/page.tsx',
  ]) {
    assert.equal(isRelevantPath(p), false, `${p} で誤検知`);
  }
});

test('request が配列でも全件見る', () => {
  const { ok, results } = checkDispatchFreshness({
    requests: [
      { workflow: 'publish-blog.yml' },
      INCIDENT_REQUEST,
    ],
    mainPinnedWorkflows: ['sync-snapshots.yml'],
    divergedPaths: INCIDENT_DIVERGED,
  });
  assert.equal(ok, false);
  assert.equal(results.filter((r) => !r.ok).length, 1);
});
