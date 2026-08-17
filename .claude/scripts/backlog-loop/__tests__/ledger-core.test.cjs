'use strict';

/**
 * ledger の契約。
 *
 * 「完了したと言えば完了になる」を構造的に不能にするのが目的なので、
 * hasPassingGate が **gate 無しの completed を通さない**ことを最重要で固定する。
 */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  emptyLedger,
  normalizeLedger,
  recordAttempt,
  quarantinedIds,
  hasPassingGate,
  summarizeByClassModel,
} = require('../ledger-core.cjs');

const AT = '2026-08-17T00:00:00.000Z';
const base = () => normalizeLedger(emptyLedger()).ledger;

test('gate.pass=true の completed だけが削除を裏付ける', () => {
  let l = base();

  // gate が無い completed は裏付けにならない (宣言だけの完了)
  ({ ledger: l } = recordAttempt(l, { id: 'A-01', class: 'impl-small', outcome: 'completed', at: AT }, 3));
  assert.equal(hasPassingGate(l, 'A-01'), false, 'gate 無しの completed を通してはいけない');

  // gate.pass=false も通さない
  ({ ledger: l } = recordAttempt(
    l,
    { id: 'B-01', class: 'test-fix', outcome: 'completed', at: AT, gate: { commands: ['npm test'], pass: false } },
    3,
  ));
  assert.equal(hasPassingGate(l, 'B-01'), false);

  // gate.pass=true で初めて通る
  ({ ledger: l } = recordAttempt(
    l,
    { id: 'C-01', class: 'test-fix', outcome: 'completed', at: AT, gate: { commands: ['npm test'], pass: true } },
    3,
  ));
  assert.equal(hasPassingGate(l, 'C-01'), true);

  // 未知の ID は当然通らない
  assert.equal(hasPassingGate(l, 'NOPE-01'), false);
});

test('quarantine は連続失敗で入り、1 度の成功で消える', () => {
  let l = base();
  const fail = (n) => {
    for (let i = 0; i < n; i += 1) {
      ({ ledger: l } = recordAttempt(
        l,
        { id: 'D-01', class: 'impl-small', outcome: 'failed', at: AT, failReason: 'gate 未達' },
        3,
      ));
    }
  };

  fail(2);
  assert.equal(quarantinedIds(l, 3).has('D-01'), false, '2 回では外さない');

  fail(1);
  assert.equal(quarantinedIds(l, 3).has('D-01'), true, '3 回連続で外す');
  assert.equal(l.items['D-01'].status, 'quarantined');

  ({ ledger: l } = recordAttempt(
    l,
    { id: 'D-01', class: 'impl-small', outcome: 'completed', at: AT, gate: { commands: ['x'], pass: true } },
    3,
  ));
  assert.equal(quarantinedIds(l, 3).has('D-01'), false, '成功したら即復帰する');
  assert.equal(l.items['D-01'].quarantine.failCount, 0);
});

test('deferred も連続すれば quarantine に入る (再現不能を無限に試さない)', () => {
  let l = base();
  for (let i = 0; i < 3; i += 1) {
    ({ ledger: l } = recordAttempt(
      l,
      { id: 'E-01', class: 'misconception-close', outcome: 'deferred', at: AT, failReason: 'CI で再現不能' },
      3,
    ));
  }
  assert.equal(quarantinedIds(l, 3).has('E-01'), true);
  assert.equal(l.items['E-01'].quarantine.lastReason, 'CI で再現不能');
});

test('分類が変わったら履歴に残す (誤分類は学習材料なので上書きしない)', () => {
  let l = base();
  ({ ledger: l } = recordAttempt(l, { id: 'F-01', class: 'mechanical-gate', outcome: 'escalated', at: AT }, 3));
  ({ ledger: l } = recordAttempt(l, { id: 'F-01', class: 'impl-large', outcome: 'failed', at: AT }, 3));
  assert.deepEqual(l.items['F-01'].reclassifiedFrom, [
    { from: 'mechanical-gate', to: 'impl-large', at: AT },
  ]);
  assert.equal(l.items['F-01'].class, 'impl-large');
  assert.equal(l.items['F-01'].attempts.length, 2);
});

test('completed でも再出現したら open に戻して attempt を積む (再発を隠さない)', () => {
  let l = base();
  ({ ledger: l } = recordAttempt(
    l,
    { id: 'G-01', class: 'test-fix', outcome: 'completed', at: AT, gate: { commands: ['t'], pass: true } },
    3,
  ));
  assert.equal(l.items['G-01'].status, 'completed');
  ({ ledger: l } = recordAttempt(l, { id: 'G-01', class: 'test-fix', outcome: 'failed', at: AT }, 3));
  assert.equal(l.items['G-01'].status, 'open');
  assert.equal(l.items['G-01'].attempts.length, 2);
  assert.equal(l.items['G-01'].completedAt, AT, '過去に完了した事実は残す');
});

test('needs-owner は自動で解除しない', () => {
  let l = base();
  l.items['H-01'] = {
    class: 'needs-owner',
    status: 'needs-owner',
    sourceFile: null,
    title: null,
    attempts: [],
    quarantine: { failCount: 0, lastReason: null, since: null },
    reclassifiedFrom: [],
    completedAt: null,
  };
  ({ ledger: l } = recordAttempt(l, { id: 'H-01', class: 'needs-owner', outcome: 'skipped', at: AT }, 3));
  assert.equal(l.items['H-01'].status, 'needs-owner');
});

test('壊れた台帳は例外で止めず空から作り直す (ループ全体を止めない)', () => {
  const { ledger, recovered } = normalizeLedger({ version: 99, items: 'broken' });
  assert.equal(recovered, true);
  assert.deepEqual(ledger.items, {});
});

test('不正な outcome / id は throw する (黙って握り潰さない)', () => {
  const l = base();
  assert.throws(() => recordAttempt(l, { id: 'X', class: 'c', outcome: 'done', at: AT }, 3), /未知の outcome/);
  assert.throws(() => recordAttempt(l, { id: '', class: 'c', outcome: 'failed', at: AT }, 3), /id/);
  assert.throws(() => recordAttempt(l, { id: 'X', class: 'c', outcome: 'failed' }, 3), /at/);
});

test('class×model の成功率を集計する (学習の入力)', () => {
  let l = base();
  const add = (id, cls, model, outcome) => {
    ({ ledger: l } = recordAttempt(l, { id, class: cls, model, outcome, at: AT, costUsd: 0.5, turns: 10 }, 3));
  };
  add('I-01', 'impl-small', 'sonnet', 'completed');
  add('I-02', 'impl-small', 'sonnet', 'failed');
  add('I-03', 'impl-large', 'fable', 'completed');

  const rows = summarizeByClassModel(l);
  const small = rows.find((r) => r.class === 'impl-small' && r.model === 'sonnet');
  assert.equal(small.total, 2);
  assert.equal(small.successRate, 0.5);
  assert.equal(small.costUsd, 1);
  const large = rows.find((r) => r.class === 'impl-large' && r.model === 'fable');
  assert.equal(large.successRate, 1);
});
