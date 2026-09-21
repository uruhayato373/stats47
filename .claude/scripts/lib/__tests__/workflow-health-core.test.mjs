import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyRun,
  evaluateAll,
  evaluateWorkflow,
  evaluateSchedule,
  formatReport,
  SCHEDULE_CONTRACTS,
} from '../workflow-health-core.mjs';

const NOW = Date.parse('2026-08-13T00:00:00Z');
const run = (over = {}) => ({
  id: 1,
  event: 'schedule',
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

// 初回予定・周期が未定義のworkflowには日次前提を押し付けない。
test('schedule契約の無いworkflowはrun未観測だけでunhealthyにしない', () => {
  const r = evaluateWorkflow('new.yml', [], { nowMs: NOW });
  assert.equal(r.unhealthy, false);
  assert.equal(r.runsInspected, 0);
  assert.equal(r.schedule, null);
});

const AUTHENTICATED = 'authenticated-measurement.yml';
const scheduledRun = (createdAt, over = {}) => run({ createdAt, updatedAt: createdAt, ...over });

test('初回予定の前・実測3時間25分遅延・6時間猶予内は未発火を許容する', () => {
  for (const at of ['2026-09-21T01:40:25Z', '2026-09-21T12:45:00Z', '2026-09-21T15:19:59.999Z']) {
    const result = evaluateWorkflow(AUTHENTICATED, [], { nowMs: Date.parse(at) });
    assert.equal(result.unhealthy, false, at);
    assert.equal(result.schedule.code, null);
    assert.equal(result.schedule.expectedAt, '2026-09-21T09:20:00.000Z');
    assert.equal(result.schedule.deadlineAt, '2026-09-21T15:20:00.000Z');
  }
});

test('初回予定から6時間経過して未発火なら検出する', () => {
  const result = evaluateWorkflow(AUTHENTICATED, [], { nowMs: Date.parse('2026-09-21T15:20:00Z') });
  assert.equal(result.unhealthy, true);
  assert.equal(result.failureStreak, 0);
  assert.equal(result.schedule.code, 'scheduled_run_missing');
  assert.equal(result.schedule.lastRunAt, null);
});

test('翌日も予定枠から6時間を待ち、前日の遅延で期限を延ばさない', () => {
  const runs = [scheduledRun('2026-09-21T12:45:00Z')];
  assert.equal(evaluateWorkflow(AUTHENTICATED, runs, {
    nowMs: Date.parse('2026-09-22T15:19:59.999Z'),
  }).unhealthy, false);
  const result = evaluateWorkflow(AUTHENTICATED, runs, { nowMs: Date.parse('2026-09-22T15:20:00Z') });
  assert.equal(result.unhealthy, true);
  assert.equal(result.schedule.code, 'scheduled_run_stale');
  assert.equal(result.schedule.expectedAt, '2026-09-22T09:20:00.000Z');
});

test('古いschedule成功を今日再試行してもcreatedAt基準で停止を検出する', () => {
  const result = evaluateWorkflow(AUTHENTICATED, [scheduledRun('2026-09-21T09:20:00Z', {
    runStartedAt: '2026-09-23T15:30:00Z', updatedAt: '2026-09-23T15:40:00Z',
  })], { nowMs: Date.parse('2026-09-23T16:00:00Z') });
  assert.equal(result.unhealthy, true);
  assert.equal(result.schedule.code, 'scheduled_run_stale');
});

test('push/manualの成功は初回未発火・古いschedule・連続失敗を解消しない', () => {
  const manual = ['push', 'workflow_dispatch'].map(event => scheduledRun('2026-09-23T15:30:00Z', { event }));
  const nowMs = Date.parse('2026-09-23T16:00:00Z');
  const missing = evaluateWorkflow(AUTHENTICATED, manual, { nowMs });
  assert.equal(missing.schedule.code, 'scheduled_run_missing');
  assert.equal(missing.runsInspected, 0);
  const stale = evaluateWorkflow(AUTHENTICATED, [...manual, scheduledRun('2026-09-21T09:20:00Z')], { nowMs });
  assert.equal(stale.schedule.code, 'scheduled_run_stale');
  const failures = evaluateWorkflow(AUTHENTICATED, [...manual,
    scheduledRun('2026-09-23T09:20:00Z', { conclusion: 'failure' }),
    scheduledRun('2026-09-22T09:20:00Z', { conclusion: 'failure' }),
  ], { nowMs });
  assert.equal(failures.failureStreak, 2);
  assert.equal(failures.unhealthy, true);
});

test('新しいscheduleが実行中なら未発火を解消し、成功で既存失敗判定も復旧する', () => {
  const nowMs = Date.parse('2026-09-23T16:00:00Z');
  for (const conclusion of [null, 'success']) {
    const result = evaluateWorkflow(AUTHENTICATED, [scheduledRun('2026-09-23T15:30:00Z', { conclusion })], { nowMs });
    assert.equal(result.schedule.code, null);
    assert.equal(result.unhealthy, false);
  }
});

test('欠損・不正・未来のcreatedAtは未発火を隠さない', () => {
  for (const createdAt of [undefined, 'invalid', '2026-09-24T09:20:00Z']) {
    assert.equal(evaluateWorkflow(AUTHENTICATED, [scheduledRun(createdAt)], {
      nowMs: Date.parse('2026-09-23T16:00:00Z'),
    }).schedule.code, 'scheduled_run_missing');
  }
});

test('時刻未指定と契約外cronの古い成功では新規の停止判定を行わない', () => {
  assert.equal(evaluateWorkflow(AUTHENTICATED, []).schedule, null);
  assert.equal(evaluateWorkflow('weekly.yml', [run()], {
    nowMs: Date.parse('2026-09-23T16:00:00Z'),
  }).unhealthy, false);
});

test('再利用する予定枠計算も手動runを除外する', () => {
  const result = evaluateSchedule(AUTHENTICATED, [scheduledRun('2026-09-23T15:30:00Z', {
    event: 'workflow_dispatch',
  })], Date.parse('2026-09-23T16:00:00Z'));
  assert.equal(result.code, 'scheduled_run_missing');
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

test('未発火もunhealthy集計と報告へ入り、0回連続失敗と誤表示しない', () => {
  const summary = evaluateAll([{ workflow: AUTHENTICATED, runs: [] }], {
    nowMs: Date.parse('2026-09-22T00:00:00Z'),
  });
  assert.equal(summary.unhealthy.length, 1);
  const out = formatReport(summary);
  assert.match(out, /scheduled_run_missing/);
  assert.match(out, /2026-09-21T09:20:00.000Z/);
  assert.match(out, /猶予 6時間/);
  assert.doesNotMatch(out, /0 回連続失敗/);
});

test('明示schedule契約は実workflowのUTC日次cronと一致する', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: yaml } = await import('js-yaml');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  for (const [workflow, contract] of Object.entries(SCHEDULE_CONTRACTS)) {
    const source = yaml.load(fs.readFileSync(path.join(root, '.github/workflows', workflow), 'utf8'));
    const first = new Date(contract.firstExpectedAt);
    assert.equal(contract.intervalHours, 24);
    assert.deepEqual(source.on.schedule, [{ cron: `${first.getUTCMinutes()} ${first.getUTCHours()} * * *` }]);
  }
});

test('API取得はscheduleで絞り込み、eventを判定層まで維持する', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync(new URL('../../ci/audit-workflow-health.mjs', import.meta.url), 'utf8');
  assert.match(source, /runs\?event=schedule&per_page=/);
  assert.match(source, /event: r\.event/);
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
  // ★ai-content / blog の日次生成ループは 2026-08-21 に削除した。列挙は readdirSync なので
  //   監視対象は自動で追従するが、この allowlist だけは実在する cron に差し替える。
  for (const known of ['backlog-loop-daily.yml', 'blog-remediation-daily.yml', 'sync-rakuten-catalog.yml']) {
    assert.ok(scheduled.includes(known), `${known} が scheduled から漏れている`);
  }
});

// ── workflow の配線 ──────────────────────────────────────────────────────────

// core とテストがあっても workflow から呼ばれていなければ 1 度も走らない。
// (今回の事故の一般形: 「作ったが配線していない」)
test('日次 workflow が両方の監査を呼び、片方でも赤なら Issue を立てる', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const source = fs.readFileSync(path.join(root, '.github/workflows/workflow-health-daily.yml'), 'utf8');

  assert.match(source, /audit-workflow-health\.mjs/, 'cron 監査を呼んでいない');
  assert.match(source, /audit-r2-freshness\.mjs/, '鮮度監査を呼んでいない');
  assert.match(
    source,
    /gh run list --workflow affiliate-ga4-weekly\.yml --event schedule --status success/,
    '手動backfillのartifactが週次運用の成功を偽装する',
  );
  // どちらか一方でも異常なら Issue (&& にすると片方の異常を見逃す)
  assert.match(
    source,
    /healthy != 'true' \|\| steps\.freshness\.outputs\.fresh != 'true'/,
    'Issue の条件が OR でない = 片方の異常を見逃す',
  );
  // 復旧 close は両方 healthy のときだけ (|| にすると異常が残っていても閉じる)
  assert.match(
    source,
    /healthy == 'true' && steps\.freshness\.outputs\.fresh == 'true'/,
    'close の条件が AND でない = 異常が残っていても Issue を閉じる',
  );
});

test('R2鮮度監査がaffiliate GA4 latestを公開read pathから監視する', async () => {
  const { WATCHED } = await import('../../ci/audit-r2-freshness.mjs');
  const target = WATCHED.find((entry) => entry.key === 'state/ads/ga4-affiliate/latest.json');
  assert.ok(target, 'affiliate GA4 latestがR2鮮度監査から漏れている');
  assert.equal(target.maxAgeDays, 10);
});
