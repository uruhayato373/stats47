import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyRun,
  evaluateAll,
  evaluateWorkflow,
  formatReport,
} from '../workflow-health-core.mjs';

const NOW = Date.parse('2026-08-13T00:00:00Z');
const run = (over = {}) => ({
  id: 1,
  conclusion: 'success',
  createdAt: '2026-08-12T00:00:00Z',
  runStartedAt: '2026-08-12T00:00:00Z',
  updatedAt: '2026-08-12T00:10:00Z',
  ...over,
});

// ── classifyRun ───────────────────────────────────────────────────────────────

test('success / failure / timed_out はそのまま分類する', () => {
  assert.equal(classifyRun(run()), 'success');
  assert.equal(classifyRun(run({ conclusion: 'failure' })), 'failure');
  assert.equal(classifyRun(run({ conclusion: 'timed_out' })), 'failure');
  assert.equal(classifyRun(run({ conclusion: 'startup_failure' })), 'failure');
});

// GitHub は「job timeout で打ち切り」と「後続 push が concurrency で潰した」を
// 同じ cancelled で返す。実行時間でしか区別できない。
test('長時間走った cancelled は失敗 (job timeout)', () => {
  const timedOut = run({
    conclusion: 'cancelled',
    runStartedAt: '2026-08-12T00:00:00Z',
    updatedAt: '2026-08-12T04:00:00Z', // 240 分
  });
  assert.equal(classifyRun(timedOut), 'failure');
});

test('すぐ終わった cancelled は無視する (concurrency の打ち消し)', () => {
  const superseded = run({
    conclusion: 'cancelled',
    runStartedAt: '2026-08-12T00:00:00Z',
    updatedAt: '2026-08-12T00:00:20Z',
  });
  assert.equal(classifyRun(superseded), 'neutral');
});

test('実行中 (conclusion null) と skipped は neutral', () => {
  assert.equal(classifyRun(run({ conclusion: null })), 'neutral');
  assert.equal(classifyRun(run({ conclusion: 'skipped' })), 'neutral');
});

// ── evaluateWorkflow ─────────────────────────────────────────────────────────

test('連続失敗が閾値に達したら unhealthy', () => {
  const r = evaluateWorkflow('rakuten.yml', [
    run({ conclusion: 'failure', createdAt: '2026-08-12T00:00:00Z' }),
    run({ conclusion: 'failure', createdAt: '2026-08-11T00:00:00Z' }),
    run({ conclusion: 'success', updatedAt: '2026-08-04T07:24:00Z' }),
  ], { nowMs: NOW });
  assert.equal(r.unhealthy, true);
  assert.equal(r.failureStreak, 2);
  assert.equal(r.daysSinceSuccess, 8);
});

test('直近が成功なら healthy (過去に失敗があっても)', () => {
  const r = evaluateWorkflow('blog.yml', [
    run({ conclusion: 'success' }),
    run({ conclusion: 'failure' }),
    run({ conclusion: 'failure' }),
  ], { nowMs: NOW });
  assert.equal(r.unhealthy, false);
  assert.equal(r.failureStreak, 0);
});

test('neutral は streak を切らないが数えもしない', () => {
  const r = evaluateWorkflow('x.yml', [
    run({ conclusion: 'cancelled', updatedAt: '2026-08-12T00:00:10Z' }), // 打ち消し
    run({ conclusion: 'failure' }),
    run({ conclusion: 'skipped' }),
    run({ conclusion: 'failure' }),
    run({ conclusion: 'success' }),
  ], { nowMs: NOW });
  assert.equal(r.failureStreak, 2, 'neutral を挟んでも連続失敗として数える');
  assert.equal(r.unhealthy, true);
});

// run が無い workflow を赤にすると、新設直後の cron が毎回赤くなって
// 誰も見なくなる。確実に言える形だけを赤にする。
test('run が 1 件も無ければ unhealthy にしない', () => {
  const r = evaluateWorkflow('new.yml', [], { nowMs: NOW });
  assert.equal(r.unhealthy, false);
  assert.equal(r.runsInspected, 0);
});

test('1 回だけの失敗では鳴らない (既定 minStreak=2)', () => {
  const r = evaluateWorkflow('x.yml', [run({ conclusion: 'failure' }), run({ conclusion: 'success' })], {
    nowMs: NOW,
  });
  assert.equal(r.unhealthy, false);
  assert.equal(r.failureStreak, 1);
});

test('minStreak は設定で変えられる', () => {
  const runs = [run({ conclusion: 'failure' }), run({ conclusion: 'success' })];
  assert.equal(evaluateWorkflow('x.yml', runs, { nowMs: NOW, minStreak: 1 }).unhealthy, true);
});

test('一度も成功していない場合は everSucceeded=false', () => {
  const r = evaluateWorkflow('x.yml', [
    run({ conclusion: 'failure' }),
    run({ conclusion: 'failure' }),
  ], { nowMs: NOW });
  assert.equal(r.everSucceeded, false);
  assert.equal(r.lastSuccessAt, null);
  assert.equal(r.daysSinceSuccess, null);
});

// ── evaluateAll / formatReport ───────────────────────────────────────────────

test('unhealthy は streak の多い順に並ぶ', () => {
  const s = evaluateAll(
    [
      { workflow: 'a.yml', runs: [run({ conclusion: 'failure' }), run({ conclusion: 'failure' })] },
      { workflow: 'b.yml', runs: Array.from({ length: 5 }, () => run({ conclusion: 'failure' })) },
      { workflow: 'c.yml', runs: [run()] },
    ],
    { nowMs: NOW },
  );
  assert.equal(s.checked, 3);
  assert.deepEqual(s.unhealthy.map((r) => r.workflow), ['b.yml', 'a.yml']);
});

test('全部 healthy なら報告は「無い」と言い切る', () => {
  const s = evaluateAll([{ workflow: 'a.yml', runs: [run()] }], { nowMs: NOW });
  const out = formatReport(s);
  assert.match(out, /連続失敗している cron は無い/);
});

test('報告に workflow 名・連続回数・run URL が出る', () => {
  const s = evaluateAll(
    [
      {
        workflow: 'rakuten.yml',
        runs: [
          run({ id: 111, conclusion: 'failure' }),
          run({ id: 222, conclusion: 'failure' }),
          run({ conclusion: 'success', updatedAt: '2026-08-04T00:00:00Z' }),
        ],
      },
    ],
    { nowMs: NOW },
  );
  const out = formatReport(s, { repoUrl: 'https://github.com/o/r' });
  assert.match(out, /rakuten\.yml: 2 回連続失敗/);
  assert.match(out, /最終成功から 9 日/);
  assert.match(out, /https:\/\/github\.com\/o\/r\/actions\/runs\/111/);
});

// ── isScheduled ──────────────────────────────────────────────────────────────

test('cron を持つ workflow だけを scheduled と判定する', async () => {
  const { isScheduled } = await import('../workflow-health-core.mjs');
  assert.equal(isScheduled('on:\n  schedule:\n    - cron: "0 18 * * *"\n'), true);
  assert.equal(isScheduled('on:\n  push:\n    branches: [develop]\n'), false);
  // コメント内の schedule: を拾わない (拾うと対象が水増しされる)
  assert.equal(isScheduled('on:\n  push:\n# schedule:\n#   - cron: "0 1 * * *"\n'), false);
  // schedule はあるが cron が無い (ありえない形だが、片方だけでは判定しない)
  assert.equal(isScheduled('on:\n  schedule:\n'), false);
});

test('実在の workflow で scheduled 判定が妥当な件数になる', async () => {
  const { isScheduled } = await import('../workflow-health-core.mjs');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const dir = path.join(root, '.github/workflows');
  const all = fs.readdirSync(dir).filter((f) => f.endsWith('.yml'));
  const scheduled = all.filter((f) => isScheduled(fs.readFileSync(path.join(dir, f), 'utf8')));
  // 全部でも 0 でもない = 判定が実際に効いている
  assert.ok(scheduled.length > 5, `scheduled が ${scheduled.length} 件しか無い = 判定が厳しすぎる`);
  assert.ok(scheduled.length < all.length, 'すべてを scheduled と判定している = 判定が効いていない');
  // 既知の cron が漏れていない
  for (const known of ['ai-content-generate-daily.yml', 'blog-generate-daily.yml', 'sync-rakuten-catalog.yml']) {
    assert.ok(scheduled.includes(known), `${known} が scheduled から漏れている`);
  }
});
