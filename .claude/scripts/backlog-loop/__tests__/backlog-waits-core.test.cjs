'use strict';

/**
 * backlog-waits (承認待ちの一覧・期日が来るカード・流入と流出) の契約。
 *
 * 週次レビューでオーナーにそのまま見せる表と、週次の健全性の集計 (cycle-health) が読む数なので、
 * 「何を数えて何を数えないか」と「1 枚 1 行に収まるか」を固定する。
 */

const assert = require('node:assert/strict');
const test = require('node:test');

const { parseAnnual, parseBacklog } = require('../../lib/backlog-lib.cjs');
const core = require('../backlog-waits-core.cjs');

const BACKLOG = [
  '## 🔴 高',
  '',
  '### [PUB-NEW-01] 新しい記事を公開する',
  'タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-10] [領域:サイト] [待ち:承認] [検証:npm run issues:figures]',
  '',
  '- **起点**: 下書きは入っている。',
  '- **次**: オーナーが全文を確認して承認したら `published: true` にする。',
  '- **停止条件**: 承認の前に公開しない。',
  '- **残り**: X の下書きを承認へ回す (3 行目は出さない)。',
  '',
  '### [PUB-OLD-01] 古い公開待ち | パイプ入り',
  'タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-09-01] [領域:サイト] [待ち:承認]',
  '',
  '本文に目印の語が無い。',
  '',
  '### [R2-WRITE-01] R2 の正本を上書きする',
  'タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-01] [領域:データ] [待ち:承認] [待ち:判断]',
  '',
  `- **停止条件**: ${'長い説明。'.repeat(40)}`,
  '',
  '### [NO-LANE-01] 領域の無い承認待ち',
  'タグ: [収益化] [実行:対話] [起票:2026-08-01] [待ち:承認]',
  '',
  '## 🟡 中',
  '',
  '### [OLD-OWNERLESS-01] 誰も持っていない古いカード',
  'タグ: [収益化] [種類:改善] [起票:2026-09-01] [期日:2026-11-01]',
  '',
  '### [OLD-SWEEP-01] 自動処理が持つ古いカード',
  'タグ: [収益化] [種類:改善] [実行:sweep] [起票:2026-09-01]',
  '',
  '### [LOGIN-01] ログインを待つ',
  'タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-11-16] [期日:2026-11-18] [待ち:ログイン]',
].join('\n');

const ANNUAL = [
  '## 2026-11',
  '',
  '### [WAIT-TIME-01] 公表を待つ',
  'タグ: [インフラ・計測] [種類:改善] [実行:機械] [起票:2026-11-02] [期日:2026-11-20] [待ち:時期]',
  '',
  '## 2026-12',
  '',
  '### [WAIT-OBS-01] 判定日を待つ',
  'タグ: [インフラ・計測] [種類:改善] [実行:機械] [起票:2026-11-09] [期日:2026-12-15] [待ち:観測]',
].join('\n');

test('承認の目印 (承認・停止条件・残り) を含む行だけを 2 行まで抜き、記号と太字を外して 1 行にする', () => {
  const [card] = parseBacklog(BACKLOG);
  assert.equal(
    core.approvalNote(card.body),
    '次: オーナーが全文を確認して承認したら `published: true` にする。 / 停止条件: 承認の前に公開しない。',
  );
  assert.equal(core.approvalNote('目印の無い本文'), '');
});

test('抜き出しは 120 字で切り、切ったことを … で示す', () => {
  const card = parseBacklog(BACKLOG).find((c) => c.id === 'R2-WRITE-01');
  const note = core.approvalNote(card.body);
  assert.equal([...note].length, core.APPROVAL_NOTE_MAX_CHARS);
  assert.ok(note.endsWith('…'));
  assert.ok(note.startsWith('停止条件: 長い説明。'));
});

test('承認の表は [待ち:承認] だけを、領域の順 (領域なしは最後)・領域の中は起票の古い順に並べる', () => {
  const rows = core.buildApprovals(parseBacklog(BACKLOG));
  assert.deepEqual(
    rows.map((r) => [r.lane, r.id]),
    [
      ['サイト', 'PUB-OLD-01'],
      ['サイト', 'PUB-NEW-01'],
      ['データ', 'R2-WRITE-01'],
      ['(領域なし)', 'NO-LANE-01'],
    ],
  );
  assert.equal(rows[1].verify, 'npm run issues:figures');
  assert.equal(rows[1].filed, '2026-11-10');
});

test('承認の表の markdown はセルの | を逃がし、1 枚 1 行に収める', () => {
  const md = core.formatApprovals(core.buildApprovals(parseBacklog(BACKLOG)));
  const line = md.split('\n').find((l) => l.includes('PUB-OLD-01'));
  assert.match(line, /古い公開待ち \\\| パイプ入り/);
  assert.equal(line.split(/(?<!\\)\|/).length - 2, 6, '列は 6 つ');
  assert.match(md, /承認待ち \(4 枚/);
});

test('期間は ISO 週 (月曜〜日曜)・月 (1 日〜末日・うるう年)・from/to のどれか 1 つで決まる', () => {
  assert.deepEqual(core.resolveRange({ week: '2026-W47', today: '2026-11-14' }), { from: '2026-11-16', to: '2026-11-22', label: '2026-W47' });
  assert.deepEqual(core.resolveRange({ month: '2026-12', today: '2026-11-14' }), { from: '2026-12-01', to: '2026-12-31', label: '2026-12' });
  assert.equal(core.resolveRange({ month: '2028-02', today: '2026-11-14' }).to, '2028-02-29');
  assert.equal(core.resolveRange({ today: '2026-11-14' }).label, '2026-W46', '指定なしは今週');
  assert.throws(() => core.resolveRange({ week: '2026-W47', month: '2026-12', today: '2026-11-14' }), /どれか 1 つ/);
  assert.throws(() => core.resolveRange({ from: '2026-11-01', today: '2026-11-14' }), /両方/);
  assert.throws(() => core.resolveRange({ month: '2026-13', today: '2026-11-14' }), /YYYY-MM/);
});

test('期日の表は backlog と年間計画の両方から引き、置き場と待ちの理由と月を持つ', () => {
  const report = core.buildDue({ backlogText: BACKLOG, annualText: ANNUAL, from: '2026-11-16', to: '2026-11-22' });
  assert.deepEqual(
    report.due.map((c) => [c.id, c.source, c.waits, c.month]),
    [
      ['LOGIN-01', 'backlog', ['ログイン'], null],
      ['WAIT-TIME-01', 'annual', ['時期'], '2026-11'],
    ],
  );
  assert.deepEqual(report.overdue.map((c) => c.id), ['OLD-OWNERLESS-01']);
  assert.match(core.formatDue(report, '2026-W47'), /\| 2026-11-20 \| annual \| `WAIT-TIME-01` \| 公表を待つ \| 時期 \|/);
});

test('流入は残っているカードの起票週、流出は台帳の completed の記録週 (JST) で数え、open は数えない', () => {
  const ledgerItems = {
    'DONE-A-01': { status: 'completed', class: 'impl-small', completedAt: '2026-11-10T01:00:00.000Z' },
    // JST では 11-16 (月) なので次の週
    'DONE-B-01': { status: 'completed', class: 'stale', completedAt: '2026-11-15T16:00:00.000Z' },
    // completedAt が無ければ最後の試行の日
    'DONE-C-01': { status: 'completed', class: 'stale', attempts: [{ at: '2026-11-03T00:00:00.000Z' }] },
    'OPEN-01': { status: 'open', class: 'impl-small', attempts: [{ at: '2026-11-10T00:00:00.000Z' }] },
    'QUAR-01': { status: 'quarantined', class: 'impl-small', completedAt: '2026-11-10T00:00:00.000Z' },
  };
  const flow = core.buildFlow({
    backlogCards: parseBacklog(BACKLOG),
    annualCards: parseAnnual(ANNUAL),
    ledgerItems,
    today: '2026-11-17',
    weeks: 3,
  });
  assert.deepEqual(flow.weeks, [
    { week: '2026-W45', filed: 1, closed: 1, closedStale: 1 },
    { week: '2026-W46', filed: 2, closed: 1, closedStale: 0 },
    { week: '2026-W47', filed: 1, closed: 1, closedStale: 1 },
  ]);
  assert.equal(flow.limits.length, 2, '消えたカードを数えられない限界を出力に書く');
});

test('総枚数は backlog だけで目安と比べ、待ちの理由ごとと DG093 の古いカードを数える', () => {
  const flow = core.buildFlow({
    backlogCards: parseBacklog(BACKLOG),
    annualCards: parseAnnual(ANNUAL),
    ledgerItems: {},
    today: '2026-11-17',
    weeks: 1,
    target: 6,
  });
  assert.equal(flow.total, 7);
  assert.equal(flow.annualTotal, 2);
  assert.equal(flow.overTarget, true);
  assert.equal(core.buildFlow({ backlogCards: parseBacklog(BACKLOG), annualCards: [], ledgerItems: {}, today: '2026-11-17', weeks: 1 }).target, 200);
  assert.deepEqual(flow.byWait, { 承認: 4, 時期: 0, 観測: 0, ログイン: 1, 判断: 1, なし: 2 });
  // 起票 30 日超で、待ち・実行の宣言・外部作業のどれも無いのは OLD-OWNERLESS-01 だけ (sweep と承認待ちは持ち主がいる)
  assert.equal(flow.untriagedStale, 1);
  assert.match(core.formatFlow(flow), /7 \/ 目安 6 \(1 枚超過\)/);
  assert.throws(() => core.buildFlow({ backlogCards: [], annualCards: [], ledgerItems: {}, today: '2026-11-17', weeks: 0 }), /weeks/);
});
