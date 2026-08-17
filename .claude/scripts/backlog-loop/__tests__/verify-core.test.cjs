'use strict';

/**
 * verify の契約 — backlog-loop の安全装置の中核。
 *
 * このテストが緑なだけでは「何も見ていない」と区別がつかないので、**両方向**で固定する:
 * ①正しい削除 (gate 証拠あり) を通すこと ②gate 無しの削除で必ず落ちること。
 * ②が落ちなくなったら、モデルは「直しました」と言うだけでバックログを消せるようになる。
 */

const assert = require('node:assert/strict');
const test = require('node:test');

const { verifyRemovals, verifyChangedPaths, diffEntryIds } = require('../verify-core.cjs');
const { emptyLedger, normalizeLedger, recordAttempt } = require('../ledger-core.cjs');

const AT = '2026-08-17T00:00:00.000Z';
const FILE = 'docs/todo/05_機能バックログ.md';

const doc = (ids) =>
  [
    '# バックログ',
    '',
    '## P1 今月',
    '',
    ...ids.flatMap((id) => [`### [${id}] ${id} のタイトル`, '', '- **status**: pending', '']),
  ].join('\n');

const ledgerWith = (specs) => {
  let l = normalizeLedger(emptyLedger()).ledger;
  for (const s of specs) {
    ({ ledger: l } = recordAttempt(l, { at: AT, ...s }, 3));
  }
  return l;
};

test('gate 証拠のある削除は通る', () => {
  const ledger = ledgerWith([
    { id: 'A-01', class: 'test-fix', outcome: 'completed', gate: { commands: ['npm test'], pass: true } },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01', 'B-01']), after: doc(['B-01']) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, true, JSON.stringify(r.findings));
});

test('★gate 証拠の無い削除は必ず落ちる (宣言だけの完了を不能にする)', () => {
  // 「直しました」と言って completed を積んだが gate が無いケース
  const ledger = ledgerWith([{ id: 'A-01', class: 'impl-small', outcome: 'completed' }]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01', 'B-01']), after: doc(['B-01']) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, 'removal-without-gate');
  assert.equal(r.findings[0].id, 'A-01');
});

test('★ledger に記録すら無い削除も落ちる', () => {
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc([]) }],
    ledger: normalizeLedger(emptyLedger()).ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, 'removal-without-gate');
});

test('gate.pass=false での削除も落ちる', () => {
  const ledger = ledgerWith([
    { id: 'A-01', class: 'test-fix', outcome: 'completed', gate: { commands: ['npm test'], pass: false } },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc([]) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
});

test('処理対象でない ID を巻き込んで削除したら落ちる', () => {
  const ledger = ledgerWith([
    { id: 'A-01', class: 'test-fix', outcome: 'completed', gate: { commands: ['t'], pass: true } },
    { id: 'Z-99', class: 'test-fix', outcome: 'completed', gate: { commands: ['t'], pass: true } },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01', 'Z-99']), after: doc([]) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.kind === 'removal-out-of-queue' && f.id === 'Z-99'));
});

test('gate を通したのに削除し忘れたら落ちる (次の run が同じものを再処理する)', () => {
  const ledger = ledgerWith([
    { id: 'A-01', class: 'test-fix', outcome: 'completed', gate: { commands: ['t'], pass: true } },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc(['A-01']) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, 'gate-passed-but-not-removed');
});

test('エントリの新規追加は落ちる (backlog-loop は追加しない)', () => {
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc(['A-01', 'NEW-01']) }],
    ledger: normalizeLedger(emptyLedger()).ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, 'unexpected-addition');
});

test('本文の書き換えだけなら削除とみなさない (書式変更を誤検出しない)', () => {
  const before = doc(['A-01']);
  const after = before.replace('- **status**: pending', '- **status**: pending\n- **次**: 追記した');
  const { removed, added } = diffEntryIds(before, after, FILE);
  assert.deepEqual(removed, []);
  assert.deepEqual(added, []);
});

test('触ってよいパスだけを許す', () => {
  const ok = verifyChangedPaths([
    'docs/todo/05_機能バックログ.md',
    '.claude/state/backlog-loop/ledger.json',
    '.claude/scripts/lib/check-foo.cjs',
    'packages/data-configs/src/foo.ts',
  ]);
  assert.equal(ok.ok, true, JSON.stringify(ok.violations));
});

test('★排他 writer 契約のパスは弾く (04 / memory / learned)', () => {
  const r = verifyChangedPaths([
    'docs/todo/04_改善バックログ.md',
    '.claude/memory/feedback_something.md',
    '.claude/skills/learned/pattern.md',
  ]);
  assert.equal(r.ok, false);
  assert.equal(r.violations.length, 3);
  for (const v of r.violations) assert.match(v.reason, /禁止パス/);
});

test('★秘密ファイルと許可外パスは弾く', () => {
  const r = verifyChangedPaths(['.env.local', 'apps/web/.env', 'README.md', 'some/random/file.txt']);
  assert.equal(r.ok, false);
  const paths = r.violations.map((v) => v.path);
  assert.ok(paths.includes('.env.local'));
  assert.ok(paths.includes('apps/web/.env'));
  assert.ok(paths.includes('README.md'), '許可リストに無いものは通さない');
});
