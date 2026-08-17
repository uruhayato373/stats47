'use strict';

/**
 * キュー選定の契約。
 *
 * 最重要は「触ってはいけないものを触らない」— owner 判断待ち・作業中・quarantine を
 * 拾わないこと。次に escalation が sonnet→fable→人間で止まり、Opus へ勝手に上がらないこと。
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildQueue, preClassify, escalate, routeFor } = require('../queue-core.cjs');
const { emptyLedger, normalizeLedger, recordAttempt, quarantinedIds } = require('../ledger-core.cjs');

const ROOT = path.resolve(__dirname, '../../../..');
const POLICY = JSON.parse(
  fs.readFileSync(path.join(ROOT, '.claude/config/backlog-routing-policy.json'), 'utf8'),
);
const AT = '2026-08-17T00:00:00.000Z';

const entry = (id, fields, extra = {}) => ({
  id,
  title: `${id} のタイトル`,
  section: 'P1 今月',
  sourceFile: 'docs/todo/05_機能バックログ.md',
  startLine: 1,
  endLine: 5,
  fields,
  body: '',
  ...extra,
});

const emptyL = () => normalizeLedger(emptyLedger()).ledger;

test('owner 判断待ちは queue に入らず needsOwner へ回る', () => {
  const entries = [
    entry('OWNER-01', { status: 'blocked-owner-decision', tier: '0' }),
    entry('APPROVAL-01', { status: 'blocked-owner-approval', tier: '1' }),
    entry('OK-01', { status: 'pending', tier: '1' }),
  ];
  const { picked, needsOwner } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 10,
  });
  assert.deepEqual(picked.map((p) => p.id), ['OK-01']);
  assert.deepEqual(needsOwner.map((n) => n.id).sort(), ['APPROVAL-01', 'OWNER-01']);
  assert.equal(preClassify(entries[0]), 'needs-owner');
});

test('in-progress は触らない (人または別 run が作業中)', () => {
  const { picked, skipped } = buildQueue({
    entries: [entry('WIP-01', { status: 'in-progress', tier: '1' })],
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 10,
  });
  assert.equal(picked.length, 0);
  assert.match(skipped[0].reason, /in-progress/);
});

test('quarantine 中は理由つきで除外する (黙って消さない)', () => {
  let ledger = emptyL();
  for (let i = 0; i < 3; i += 1) {
    ({ ledger } = recordAttempt(
      ledger,
      { id: 'BAD-01', class: 'impl-small', outcome: 'failed', at: AT, failReason: 'gate 未達' },
      POLICY.limits.quarantineThreshold,
    ));
  }
  const { picked, skipped } = buildQueue({
    entries: [entry('BAD-01', { status: 'pending', tier: '1' })],
    ledger,
    quarantined: quarantinedIds(ledger, POLICY.limits.quarantineThreshold),
    policy: POLICY,
    limit: 10,
  });
  assert.equal(picked.length, 0);
  assert.match(skipped[0].reason, /quarantine.*3 回連続失敗.*gate 未達/);
});

test('tier の小さい順 → 試行回数の少ない順 で選ぶ', () => {
  let ledger = emptyL();
  ({ ledger } = recordAttempt(ledger, { id: 'T1-TRIED', class: 'impl-small', outcome: 'failed', at: AT }, 3));
  const entries = [
    entry('T2-FRESH', { status: 'pending', tier: '2' }),
    entry('T1-TRIED', { status: 'pending', tier: '1' }),
    entry('T1-FRESH', { status: 'pending', tier: '1' }),
  ];
  const { picked } = buildQueue({
    entries,
    ledger,
    quarantined: new Set(),
    policy: POLICY,
    limit: 3,
  });
  assert.deepEqual(picked.map((p) => p.id), ['T1-FRESH', 'T1-TRIED', 'T2-FRESH']);
});

test('limit は policy の maxItemsPerRun を超えられない (暴走の上限)', () => {
  const entries = Array.from({ length: 20 }, (_, i) =>
    entry(`BULK-${String(i).padStart(2, '0')}`, { status: 'pending', tier: '1' }),
  );
  const { picked } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 999,
  });
  assert.equal(picked.length, POLICY.limits.maxItemsPerRun);
});

test('escalation は sonnet→fable まで。その先は人間で止まり Opus へ上がらない', () => {
  let ledger = emptyL();
  ({ ledger } = recordAttempt(
    ledger,
    { id: 'ESC-01', class: 'impl-small', model: 'sonnet', outcome: 'failed', at: AT },
    3,
  ));
  const up = escalate(POLICY, 'impl-small', ledger, 'ESC-01');
  assert.equal(up.model, 'fable');
  assert.equal(up.delegate, 'agent:backlog-solver-hard', 'fable は委譲でしか使えない');

  ({ ledger } = recordAttempt(
    ledger,
    { id: 'ESC-01', class: 'impl-small', model: 'fable', outcome: 'failed', at: AT },
    9,
  ));
  const up2 = escalate(POLICY, 'impl-small', ledger, 'ESC-01');
  assert.equal(up2.class, 'needs-owner');
  assert.equal(up2.apply, 'surface-only');
  assert.ok(!POLICY.escalation.includes('opus'), 'ladder に opus を入れない');
});

test('未知の class は fable ではなく安い側へ倒す (モデルが名乗って予算を広げられない)', () => {
  const route = routeFor(POLICY, 'なにか勝手な分類');
  assert.equal(route.model, 'sonnet');
  assert.equal(route._fallback, true);
});

test('policy の全 class が model/effort/maxAttempts/delegate/apply を持つ', () => {
  for (const [name, cls] of Object.entries(POLICY.classes)) {
    for (const key of ['model', 'effort', 'maxAttempts', 'delegate', 'apply']) {
      assert.ok(key in cls, `${name} に ${key} が無い`);
    }
    assert.ok(
      ['direct-push', 'draft-pr', 'surface-only'].includes(cls.apply),
      `${name} の apply が未知: ${cls.apply}`,
    );
  }
  assert.equal(POLICY.classes['needs-owner'].apply, 'surface-only');
  assert.equal(POLICY.classes['impl-large'].model, 'fable');
});

test('実データでキューが組める (0 件なら配線が壊れている)', () => {
  const { parseHeadingEntries } = require('../parse-backlog-core.cjs');
  const file = path.join(ROOT, 'docs/todo/05_機能バックログ.md');
  const { entries } = parseHeadingEntries(fs.readFileSync(file, 'utf8'), file);
  const { picked, needsOwner, skipped } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: POLICY.limits.itemsPerRun,
  });
  assert.equal(picked.length, POLICY.limits.itemsPerRun);
  assert.ok(needsOwner.length > 0, 'blocked-owner-* が実在するので needsOwner は 0 にならない');
  assert.ok(skipped.some((s) => /in-progress/.test(s.reason)), 'in-progress が実在する');
  // 選ばれたものが owner 待ちでないこと
  for (const p of picked) {
    assert.ok(!/^blocked-owner/.test(p.status ?? ''), `owner 待ちを選んだ: ${p.id}`);
    assert.notEqual(p.status, 'in-progress');
  }
});
