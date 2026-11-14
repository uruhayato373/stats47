'use strict';

/**
 * キュー選定の契約 (v3-unified タグ宣言ベース)。
 *
 * 最重要は「触ってはいけないものを触らない」— 🟣 判断待ち・owner 系 executor・
 * [進行中]・quarantine を拾わないこと。次に escalation が sonnet→fable→人間で止まり、
 * Opus へ勝手に上がらないこと。
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

/** v3-unified カード (backlog-lib parseBacklog の出力形) を最小限で作る */
const card = (id, over = {}) => ({
  id,
  title: `${id ?? '無名'} のタイトル`,
  tier: 'high',
  section: 'high',
  sourceFile: '.claude/todo/backlog.md',
  startLine: 1,
  endLine: 5,
  category: '未分類',
  kind: null,
  // 自動処理の対象は [実行:sweep|機械] の宣言があるカードだけなので、既定は sweep にする
  executor: 'sweep',
  verify: null,
  filed: null,
  due: null,
  lane: null,
  waits: [],
  codex: false,
  wip: false,
  hasTagLine: false,
  body: '',
  ...over,
});

const emptyL = () => normalizeLedger(emptyLedger()).ledger;

test('owner 系 executor と 🟣 判断待ちは queue に入らず needsOwner へ回る', () => {
  const entries = [
    card('HOLD-01', { tier: 'hold' }),
    card('USER-01', { executor: 'ユーザー' }),
    card('DIALOG-01', { executor: '対話' }),
    card('WIN-01', { executor: 'windows' }),
    card('OK-01'),
  ];
  const { picked, needsOwner } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 10,
  });
  assert.deepEqual(picked.map((p) => p.id), ['OK-01']);
  assert.deepEqual(
    needsOwner.map((n) => n.id).sort(),
    ['DIALOG-01', 'HOLD-01', 'USER-01', 'WIN-01'],
  );
  assert.equal(preClassify(entries[0]), 'needs-owner');
  assert.equal(preClassify(entries[1]), 'needs-owner');
  assert.equal(preClassify(card('SWEEP-01', { executor: 'sweep' })), null);
});

test('[進行中] は触らない (人または別 run が作業中)', () => {
  const { picked, skipped } = buildQueue({
    entries: [card('WIP-01', { wip: true, executor: 'sweep' })],
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 10,
  });
  assert.equal(picked.length, 0);
  assert.match(skipped[0].reason, /進行中/);
});

test('ID の無いカードは処理しない (ledger に結び付けられない)', () => {
  const { picked, skipped, needsOwner } = buildQueue({
    entries: [card(null)],
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 10,
  });
  assert.equal(picked.length, 0);
  assert.equal(needsOwner.length, 0);
  assert.match(skipped[0].reason, /ID なし/);
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
    entries: [card('BAD-01')],
    ledger,
    quarantined: quarantinedIds(ledger, POLICY.limits.quarantineThreshold),
    policy: POLICY,
    limit: 10,
  });
  assert.equal(picked.length, 0);
  assert.match(skipped[0].reason, /quarantine.*3 回連続失敗.*gate 未達/);
});

test('同じ tier・同じ起票日なら ID の昇順で決まる (試行回数では並べ替えない)', () => {
  let ledger = emptyL();
  ({ ledger } = recordAttempt(ledger, { id: 'T1-A', class: 'impl-small', outcome: 'failed', at: AT }, 3));
  const entries = [
    card('T2-FRESH', { tier: 'mid' }),
    card('T1-B', { tier: 'high' }),
    card('T1-A', { tier: 'high' }),
  ];
  const { picked } = buildQueue({
    entries,
    ledger,
    quarantined: new Set(),
    policy: POLICY,
    limit: 3,
  });
  assert.deepEqual(picked.map((p) => p.id), ['T1-A', 'T1-B', 'T2-FRESH']);
});

test('limit は policy の maxItemsPerRun を超えられない (暴走の上限)', () => {
  const entries = Array.from({ length: 20 }, (_, i) =>
    card(`BULK-${String(i).padStart(2, '0')}`),
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
  const file = path.join(ROOT, '.claude/todo/backlog.md');
  const { entries } = parseHeadingEntries(fs.readFileSync(file, 'utf8'), file);
  const { picked, needsOwner, skipped } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: POLICY.limits.itemsPerRun,
  });
  assert.equal(picked.length, POLICY.limits.itemsPerRun);
  assert.ok(needsOwner.length > 0, 'owner 系 executor / 🟣 が実在するので needsOwner は 0 にならない');
  assert.ok(skipped.some((s) => /進行中/.test(s.reason)), '[進行中] が実在する');
  // 選ばれたものが owner 待ち・作業中でないこと
  const NEEDS = new Set(['対話', 'ユーザー', 'windows', '別環境']);
  for (const p of picked) {
    assert.ok(!NEEDS.has(p.executor), `owner 待ちを選んだ: ${p.id}`);
    assert.notEqual(p.tier, 'hold', `🟣 を選んだ: ${p.id}`);
  }
});

test('executor 未宣言でも本文がローカル端末依存なら needsOwner へ回る', () => {
  const entries = [
    card('LOCAL-01', {
      executor: null,
      body: '- **前提**: 永続プロファイル `.local/playwright-a8-profile` に保持する。',
    }),
    card('OK-01', {
      body: '- **完了条件**: デプロイ後に本番 URL を Googlebot UA で実測する',
    }),
  ];
  const { picked, needsOwner } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 5,
  });

  assert.deepEqual(picked.map((p) => p.id), ['OK-01'], 'ローカル依存が拾われている');

  const row = needsOwner.find((r) => r.id === 'LOCAL-01');
  assert.ok(row, 'ローカル依存が needsOwner に出ない (握り潰されている)');
  // 握り潰さず、何が引っかかったかを人に見せる
  assert.deepEqual(row.localRuntimeSignals, ['playwright-profile']);
  assert.match(row.reason, /blocked-local-runtime/);
});

test('executor が宣言済みなら宣言側の理由が優先される (二重報告しない)', () => {
  const entries = [
    card('BOTH-01', {
      executor: 'windows',
      body: '- **前提**: 永続プロファイルが要る',
    }),
  ];
  const { needsOwner } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 5,
  });
  assert.equal(needsOwner.length, 1);
  assert.match(needsOwner[0].reason, /実行:windows/);
  assert.equal(needsOwner[0].localRuntimeSignals, undefined);
});

test('★[実行:sweep] の明示宣言は local-runtime backstop を通さない (人間の override)', () => {
  const entries = [
    card('DECLARED-01', {
      executor: 'sweep',
      body: '本文に Playwright という語が引用されているだけのカード。',
    }),
  ];
  const { picked, needsOwner } = buildQueue({
    entries,
    ledger: emptyL(),
    quarantined: new Set(),
    policy: POLICY,
    limit: 5,
  });
  assert.deepEqual(picked.map((p) => p.id), ['DECLARED-01']);
  assert.equal(needsOwner.length, 0);
});

// ── 選定の規則 (2026-11-14。2026-09-27 に「優先順位と無関係なカードが上から無人で処理された」ため日次を止めた) ──
// 対象 = [実行:sweep|機械] を宣言し、[待ち:X] が無く、[進行中] でも 🟣 でもないカード。
// 並び = 不具合 → 今月の重点領域 → tier → 起票日の古い順 (無しは最後) → ID。

const run = (entries, extra = {}) =>
  buildQueue({ entries, ledger: emptyL(), quarantined: new Set(), policy: POLICY, limit: 10, ...extra });

test('★[実行:] を宣言していないカードは本文に問題が無くても拾わない (分類待ちは自動処理しない)', () => {
  const { picked, skipped } = run([
    card('UNDECLARED-01', { executor: null }),
    card('MACHINE-01', { executor: '機械' }),
    card('SWEEP-01', { executor: 'sweep' }),
  ]);
  assert.deepEqual(picked.map((p) => p.id), ['MACHINE-01', 'SWEEP-01']);
  assert.match(skipped.find((s) => s.id === 'UNDECLARED-01').reason, /実行.*宣言/);
});

test('★[待ち:X] が 1 つでもあるカードは拾わない (人の待ちは needsOwner・時期/観測は除外)', () => {
  const { picked, needsOwner, skipped } = run([
    card('WAIT-APPROVE', { waits: ['承認'] }),
    card('WAIT-LOGIN', { waits: ['ログイン'] }),
    card('WAIT-DECIDE', { waits: ['判断'] }),
    card('WAIT-TIME', { waits: ['時期'] }),
    card('WAIT-OBS', { waits: ['観測', '承認'] }),
    card('READY-01'),
  ]);
  assert.deepEqual(picked.map((p) => p.id), ['READY-01']);
  assert.deepEqual(needsOwner.map((n) => n.id).sort(), ['WAIT-APPROVE', 'WAIT-DECIDE', 'WAIT-LOGIN', 'WAIT-OBS']);
  assert.deepEqual(skipped.map((s) => s.id), ['WAIT-TIME']);
  for (const row of [...needsOwner, ...skipped]) assert.match(row.reason, /待ち:/);
});

test('★並び順: 不具合 → 重点領域 → tier → 起票日の古い順 (無しは最後) → ID', () => {
  const entries = [
    card('Z-LOW-FOCUS-OLD', { tier: 'low', lane: 'サイト', filed: '2026-01-01' }),
    card('A-HIGH-OFF', { tier: 'high', lane: 'データ', filed: '2026-01-01' }),
    card('B-MID-FOCUS-NOFILED', { tier: 'mid', lane: 'サイト' }),
    card('C-MID-FOCUS-NEW', { tier: 'mid', lane: '商品', filed: '2026-10-01' }),
    card('D-MID-FOCUS-OLD', { tier: 'mid', lane: 'サイト', filed: '2026-09-01' }),
    card('E-DEFECT-LOW-OFF', { tier: 'low', kind: '不具合', lane: 'データ' }),
    card('F-DEFECT-LOW-FOCUS', { tier: 'low', kind: '不具合', lane: 'サイト' }),
  ];
  const { ranked } = run(entries, { focusDomains: ['サイト', '商品'] });
  assert.deepEqual(ranked.map((r) => r.id), [
    'F-DEFECT-LOW-FOCUS',
    'E-DEFECT-LOW-OFF',
    'D-MID-FOCUS-OLD',
    'C-MID-FOCUS-NEW',
    'B-MID-FOCUS-NOFILED',
    'Z-LOW-FOCUS-OLD',
    'A-HIGH-OFF',
  ]);
  // 入力の並びに依存しない (決定的)
  const again = run([...entries].reverse(), { focusDomains: ['商品', 'サイト'] });
  assert.deepEqual(again.ranked.map((r) => r.id), ranked.map((r) => r.id));
});

test('★選んだ理由を各項目に持たせる (どのキーで上に来たかが読める)', () => {
  const { picked } = run(
    [
      card('DEF-01', { tier: 'low', kind: '不具合', lane: 'データ', filed: '2026-08-01' }),
      card('FOC-01', { tier: 'mid', kind: '改善', lane: 'サイト' }),
    ],
    { focusDomains: ['サイト'] },
  );
  const [def, foc] = picked;
  assert.deepEqual(def.selection.keys, { defect: true, focus: false, lane: 'データ', tier: 'low', filed: '2026-08-01' });
  assert.match(def.selection.reason, /不具合/);
  assert.match(def.selection.reason, /重点外/);
  assert.match(def.selection.reason, /2026-08-01/);
  assert.equal(foc.selection.keys.focus, true);
  assert.match(foc.selection.reason, /重点\(サイト\)/);
  assert.match(foc.selection.reason, /起票なし/);
});

test('★重点領域が読めないときは黙らず queue の出力に警告を出す', () => {
  const unread = run([card('ONE-01', { lane: 'サイト' })], { focusDomains: null });
  assert.equal(unread.picked[0].selection.keys.focus, false);
  assert.ok(unread.warnings.some((w) => /重点領域/.test(w)), '重点領域を読めないのに警告が無い');

  const read = run([card('ONE-01', { lane: 'サイト' })], { focusDomains: ['サイト'] });
  assert.deepEqual(read.warnings, []);
});
