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

const {
  verifyRemovals,
  verifyChangedPaths,
  diffEntryIds,
  ALLOWED_PATH_PATTERNS,
  FORBIDDEN_PATH_PATTERNS,
} = require('../verify-core.cjs');
const { emptyLedger, normalizeLedger, recordAttempt } = require('../ledger-core.cjs');

const AT = '2026-08-17T00:00:00.000Z';
const FILE = '.claude/todo/backlog.md';

const doc = (ids) =>
  [
    '# バックログ',
    '',
    '## 🔴 高',
    '',
    ...ids.flatMap((id) => [`### [${id}] ${id} のタイトル`, 'タグ: [起票:2026-08-01]', '']),
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

test('宣言していないエントリの新規追加は落ちる (仕事の捏造を止める)', () => {
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc(['A-01', 'NEW-01']) }],
    ledger: normalizeLedger(emptyLedger()).ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, 'unexpected-addition');
});

// 「1 件閉じたら小さい残件が 1 件出る」は正常な流れ。一切許さないと残件を闇に葬るか
// 巨大エントリのまま残すことになるので、**閉じたエントリが名指しした分だけ**通す。
test('★閉じたエントリが --follow-ups で名指しした残件は追加できる', () => {
  const ledger = ledgerWith([
    {
      id: 'A-01',
      class: 'impl-small',
      outcome: 'completed',
      gate: { commands: ['npm test'], pass: true },
      followUps: ['A-01-RESIDUAL'],
    },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01', 'B-02']), after: doc(['B-02', 'A-01-RESIDUAL']) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, true, JSON.stringify(r.findings));
});

test('★名指しは gate を通した completed にしか効かない (失敗した attempt では追加できない)', () => {
  const ledger = ledgerWith([
    { id: 'A-01', class: 'impl-small', outcome: 'failed', followUps: ['A-01-RESIDUAL'] },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc(['A-01', 'A-01-RESIDUAL']) }],
    ledger,
    queuedIds: ['A-01'],
  });
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.kind === 'unexpected-addition' && f.id === 'A-01-RESIDUAL'));
});

test('★別のエントリが名指しした残件を流用できない (queued 外の宣言は効かない)', () => {
  const ledger = ledgerWith([
    {
      id: 'Z-99',
      class: 'impl-small',
      outcome: 'completed',
      gate: { commands: ['npm test'], pass: true },
      followUps: ['A-01-RESIDUAL'],
    },
  ]);
  const r = verifyRemovals({
    files: [{ sourceFile: FILE, before: doc(['A-01']), after: doc(['A-01', 'A-01-RESIDUAL']) }],
    ledger,
    queuedIds: ['A-01'], // Z-99 は今回の処理対象ではない
  });
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.kind === 'unexpected-addition'));
});

test('本文の書き換えだけなら削除とみなさない (書式変更を誤検出しない)', () => {
  const before = doc(['A-01']);
  const after = before.replace('タグ: [起票:2026-08-01]', 'タグ: [起票:2026-08-01]\n\n- **次**: 追記した');
  const { removed, added } = diffEntryIds(before, after, FILE);
  assert.deepEqual(removed, []);
  assert.deepEqual(added, []);
});

test('ID の無いカード (分類待ち) は削除/追加の差分に数えない', () => {
  // 分類待ちカードは ledger と結び付かない。ID 差分に null が混ざると
  // 「null が消えた/増えた」という偽の finding になる。
  const before = doc(['A-01']) + '\n### タグ待ちのカード\n\n本文。\n';
  const after = doc(['A-01']);
  const { removed, added } = diffEntryIds(before, after, FILE);
  assert.deepEqual(removed, [], 'ID 無しカードの削除は差分にしない');
  assert.deepEqual(added, []);
});

test('触ってよいパスだけを許す', () => {
  const ok = verifyChangedPaths([
    '.claude/todo/backlog.md',
    '.claude/state/backlog-loop/ledger.json',
    '.claude/scripts/lib/check-foo.cjs',
    'packages/data-configs/src/foo.ts',
  ]);
  assert.equal(ok.ok, true, JSON.stringify(ok.violations));
});

test('★backlog-loop 以外の state も許す (閉じた案件の成果物がそこに出る)', () => {
  // 2026-08-17 の実案件: SEO 文字列を是正すると `.claude/state/data/` の baseline が縮む。
  // backlog-loop だけを許していたので、正当な成果物で verify が落ちた。
  const ok = verifyChangedPaths([
    '.claude/state/data/seo-meta-facts-baseline.json',
    '.claude/state/ranking/integrity-audit.json',
    '.claude/state/blog/remediation-queue.json',
  ]);
  assert.equal(ok.ok, true, JSON.stringify(ok.violations));
});

test('★排他 writer 契約のパスは弾く (improvements / memory / learned)', () => {
  const r = verifyChangedPaths([
    '.claude/todo/improvements.md',
    '.claude/memory/feedback_something.md',
    '.claude/skills/learned/pattern.md',
  ]);
  assert.equal(r.ok, false);
  assert.equal(r.violations.length, 3);
  for (const v of r.violations) assert.match(v.reason, /禁止パス/);
});

test('★ループが自分の権限・予算を広げるパスは弾く (workflow / routing policy)', () => {
  // ここを通すと allowedTools・許可パス・timeout・model を自分で緩められてしまい、
  // 他の全ての制約が意味を失う。skills / agents は通してよい (learned だけ別途禁止)。
  const r = verifyChangedPaths([
    '.github/workflows/backlog-loop-daily.yml',
    '.github/scripts/whatever.sh',
    '.claude/config/backlog-routing-policy.json',
  ]);
  assert.equal(r.ok, false);
  assert.equal(r.violations.length, 3);
  for (const v of r.violations) assert.match(v.reason, /禁止パス/);

  const allowed = verifyChangedPaths([
    '.claude/config/psi-urls.txt', // routing policy 以外の config は通す
    '.claude/skills/management/process-backlog/SKILL.md',
    '.claude/agents/backlog-processor.md',
  ]);
  assert.equal(allowed.ok, true, JSON.stringify(allowed.violations));
});

test('★秘密ファイルと許可外パスは弾く', () => {
  const r = verifyChangedPaths(['.env.local', 'apps/web/.env', 'README.md', 'some/random/file.txt']);
  assert.equal(r.ok, false);
  const paths = r.violations.map((v) => v.path);
  assert.ok(paths.includes('.env.local'));
  assert.ok(paths.includes('apps/web/.env'));
  assert.ok(paths.includes('README.md'), '許可リストに無いものは通さない');
});

// ── パス契約が移設に追従しているか (docs/todo → .claude/todo 移設 / v3-unified 統合で追加) ──

test('★improvements は「禁止パス」として弾く (improvement-triage の排他 write)', () => {
  // reason まで固定するのが要点。改名で regex を直し忘れると、improvements は ALLOWED の
  // どれにも当たらず「許可パス外」で落ちる — fail はするので気づけるが、
  // 「排他 writer 契約を守っている」という契約が「たまたま許可リストに無い」に
  // すり替わる。ここが緩むと improvements を許可リストに足した瞬間に無音で書けてしまう。
  const r = verifyChangedPaths(['.claude/todo/improvements.md']);
  assert.equal(r.ok, false);
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].reason, /禁止パス/, '「許可パス外」ではなく「禁止パス」で弾くこと');
});

test('★todo 系の path pattern が実在ファイルに当たる (改名で更新し忘れた regex を検出)', () => {
  // 「どのファイルにも当たらない regex」は、静かに無効化された安全装置と同じ。
  // 将来また台帳を移したときに更新漏れを red にするための生存性テスト。
  const fs = require('node:fs');
  const path = require('node:path');
  const ROOT = path.resolve(__dirname, '..', '..', '..', '..');

  const todoPatterns = [...ALLOWED_PATH_PATTERNS, ...FORBIDDEN_PATH_PATTERNS].filter((re) =>
    /todo/.test(re.source),
  );
  assert.equal(todoPatterns.length, 2, 'ALLOWED 1 (backlog) + FORBIDDEN 1 (improvements)');

  for (const re of todoPatterns) {
    // regex の literal (エスケープ用の \ を落とし、^ と $ を外したもの) を実パスとして解決する
    const unescaped = re.source.split('\\').join('');
    const literal = unescaped.replace(/^\^/, '').replace(/\$$/, '');
    const abs = path.join(ROOT, literal);
    assert.ok(fs.existsSync(abs), `${literal} が存在しない = regex が実体を指していない`);
    assert.ok(re.test(literal), `regex が自分の literal に一致しない: ${re.source}`);
  }
});
