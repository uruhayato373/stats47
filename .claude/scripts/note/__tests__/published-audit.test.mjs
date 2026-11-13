import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TYPE_SIZE, WEIGHTS, articleYearOf, auditArticle, buildQueue, checkBaseline, parseBody, pngSize, summarize } from '../lib/published-audit.mjs';

const typeImage = (sha) => ({ ok: true, width: TYPE_SIZE.width, height: TYPE_SIZE.height, sha });
const ranking = { key: 'a-x', title: '1人当たり県民所得ランキング', series: 'A', isPaid: false, stats47Targets: ['/ranking/income'] };
const context = (extra = {}) => ({ byNoteId: new Map(), latestYear: null, figureCheck: 'match', cardIssues: [], ...extra });
const body = (html = '') => parseBody(html);
const codes = (result) => result.issues.map((i) => i.code);

test('型の 3 枚がそろい、導線も値も合う記事は満点になる', () => {
  const result = auditArticle(ranking, body(), [typeImage('a'), typeImage('b'), typeImage('c')], context());
  assert.deepEqual(result.issues, []);
  assert.equal(result.score, 100);
});

test('ランキング記事に旧寸法の画像が残っていると、型でないと判定し実物の寸法を示す', () => {
  // 2026-11-05 に型を 1080x1350 へ移した後も、回収した旧記事には 1080x1080・1200x630 が残っていた
  const old = [{ ok: true, width: 1080, height: 1080, sha: 'a' }, { ok: true, width: 1200, height: 630, sha: 'b' }];
  const result = auditArticle(ranking, body(), old, context());
  assert.deepEqual(codes(result), ['ranking_image_not_type']);
  assert.match(result.issues[0].detail, /0\/3 枚.*1080x1080,1200x630/);
  assert.equal(result.score, 100 - WEIGHTS.ranking_image_not_type);
});

test('有料記事とランキング以外の記事には型の寸法を求めない', () => {
  // 有料は公開 API に本文の全体が出ない。手順の解説記事は図の寸法が自由
  const old = [{ ok: true, width: 1200, height: 630, sha: 'a' }];
  assert.deepEqual(auditArticle({ ...ranking, isPaid: true }, body(), old, context()).issues, []);
  assert.deepEqual(auditArticle({ ...ranking, series: 'B' }, body(), old, context()).issues, []);
});

test('同じ中身の画像を 2 か所に貼ると重複と判定する', () => {
  const result = auditArticle(ranking, body(), [typeImage('same'), typeImage('same'), typeImage('c'), typeImage('d')], context());
  assert.deepEqual(codes(result), ['image_duplicate']);
});

test('「元データ」のカードが別の指標の記事を指すと無関係、指標を確かめられないと判定不能にする', () => {
  const html = '<p name="a" id="a"><strong>この記事の元データを手元で使う</strong><br>説明</p><figure data-src="https://note.com/stats47/n/nabc123" embedded-service="note"></figure>';
  const images = [typeImage('a'), typeImage('b'), typeImage('c')];
  const other = new Map([['nabc123', { title: '服や靴の価格', stats47Targets: ['/ranking/clothes-price'] }]]);
  assert.deepEqual(codes(auditArticle(ranking, body(html), images, context({ byNoteId: other }))), ['source_card_unrelated']);
  const same = new Map([['nabc123', { title: '県民所得のデータ', stats47Targets: ['/ranking/income'] }]]);
  assert.deepEqual(codes(auditArticle(ranking, body(html), images, context({ byNoteId: same }))), []);
  const unknown = new Map([['nabc123', { title: '指標の無い商品', stats47Targets: [] }]]);
  assert.deepEqual(codes(auditArticle(ranking, body(html), images, context({ byNoteId: unknown }))), ['source_card_unverifiable']);
  // 家計データセットは十大費目を収録するのに台帳の指標は教育費だけで、53 本を無関係と誤検知した
  const dataset = new Map([['nabc123', { title: '十大費目のデータセット', series: 'D', stats47Targets: ['/ranking/education'] }]]);
  assert.deepEqual(codes(auditArticle(ranking, body(html), images, context({ byNoteId: dataset }))), ['source_card_unverifiable']);
});

test('記事の年がサイトの最新の年より古いと判定し、同じ年なら判定しない', () => {
  const images = [typeImage('a'), typeImage('b'), typeImage('c')];
  const text = body('<p>2020年度「1人当たり県民所得」の全国概要です。</p>');
  assert.deepEqual(codes(auditArticle(ranking, text, images, context({ latestYear: 2021 }))), ['stale_year']);
  assert.deepEqual(codes(auditArticle(ranking, text, images, context({ latestYear: 2020 }))), []);
});

test('題名の年を本文の年より優先する', () => {
  assert.equal(articleYearOf('【2023年】服や靴の価格', '2019年と比べると'), 2023);
  assert.equal(articleYearOf('年の無い題名', '2020年度の値。2020年度は。2015年基準'), 2020);
  assert.equal(articleYearOf('年の無い題名', '年の無い本文'), null);
});

test('既存の監査の判定を点数へ合算し、同じコードは 1 回だけ引く', () => {
  const images = [typeImage('a'), typeImage('b'), typeImage('c')];
  const result = auditArticle(ranking, body(), images, context({ figureCheck: 'body-differs', cardIssues: ['card_empty', 'card_empty'] }));
  assert.deepEqual(codes(result), ['figure_value_mismatch', 'card_visibility_issue']);
  assert.equal(result.score, 100 - WEIGHTS.figure_value_mismatch - WEIGHTS.card_visibility_issue);
});

test('PNG でないバイト列の寸法は読めないと返す', () => {
  assert.equal(pngSize(Buffer.from('not a png, but long enough to pass the length check')), null);
  const png = Buffer.alloc(24);
  png.write('\x89PNG', 0, 'latin1');
  png.writeUInt32BE(1080, 16);
  png.writeUInt32BE(1350, 20);
  assert.deepEqual(pngSize(png), { width: 1080, height: 1350 });
});

test('集計は読めなかった記事を満点にも違反にも数えない', () => {
  const summary = summarize([{ score: 100, issues: [] }, { score: 75, issues: [{ code: 'ranking_image_not_type' }] }, { score: null, issues: [] }]);
  assert.equal(summary.unread, 1);
  assert.equal(summary.clean, 1);
  assert.deepEqual(summary.byCode, { ranking_image_not_type: 1 });
  assert.equal(summary.scoreBands['60-79'], 1);
});

test('上限ちょうどは通り、1 本でも超えると落ち、減っていれば下げられると知らせる', () => {
  const summary = { byCode: { ranking_image_not_type: 103, image_duplicate: 100 }, scoreBands: { '0-59': 20 } };
  const baseline = { maxByCode: { ranking_image_not_type: 103, image_duplicate: 111, image_fetch_failed: 0 }, maxLowScore: 20 };
  const verdict = checkBaseline(summary, baseline);
  assert.equal(verdict.ok, true);
  assert.deepEqual(verdict.shrinkable, [{ key: 'image_duplicate', count: 100, max: 111 }]);
  // 新しい記事が旧い画像で公開されると 1 本増える。それを週次で止める
  const worse = checkBaseline({ ...summary, byCode: { ...summary.byCode, ranking_image_not_type: 104 } }, baseline);
  assert.equal(worse.ok, false);
  assert.deepEqual(worse.exceeded, [{ key: 'ranking_image_not_type', count: 104, max: 103 }]);
  assert.equal(checkBaseline({ ...summary, scoreBands: { '0-59': 21 } }, baseline).ok, false);
  // 上限に載せていないコード (元の監査が上限を持つカード表示など) は見ない
  assert.equal(checkBaseline({ ...summary, byCode: { ...summary.byCode, card_visibility_issue: 999 } }, baseline).ok, true);
});

test('次に直す記事を直し方ごとに分け、閲覧の多い記事から並べる', () => {
  const row = (key, codes, extra = {}) => ({ key, score: 80, issues: codes.map((code) => ({ code })), hasChartData: false, ...extra });
  const rows = [
    row('a-low-views', ['source_card_unverifiable']),
    row('a-high-views', ['source_card_unverifiable']),
    row('a-with-data', ['ranking_image_not_type'], { hasChartData: true }),
    row('recovered-old', ['ranking_image_not_type']),
    row('a-bad', ['figure_value_mismatch'], { score: 40 }),
    row('a-clean', []),
    { key: 'a-unread', score: null, issues: [], unread: true },
  ];
  const queue = Object.fromEntries(buildQueue(rows, new Map([['a-high-views', 500], ['a-low-views', 3]])).map((q) => [q.kind, q]));
  assert.deepEqual(queue['dataset-card-wording'].keys, ['a-high-views', 'a-low-views']);
  assert.deepEqual(queue['ranking-image-type'].keys, ['a-with-data']);
  // 固定コピーの無い記事は今の道具で作り直せないので、別の束にして理由を持たせる
  assert.deepEqual(queue['ranking-image-type-no-chart-data'].keys, ['recovered-old']);
  assert.match(queue['ranking-image-type-no-chart-data'].blocked, /chart-data\.json/);
  assert.deepEqual(queue['semantic-review'].keys, ['a-bad']);
  assert.equal(queue['dataset-card-wording'].total, 2);
});

test('見出しが新しくても、カードの説明文に「この記事の元データ」が残っていれば拾う', () => {
  const html = '<p name="a" id="a"><strong>関連するデータを手元で使う</strong><br>「データセット」で、この記事の元データを表計算ソフトで開ける形で配布しています。</p><figure data-src="https://note.com/stats47/n/nabc123" embedded-service="note"></figure>';
  const images = [typeImage('a'), typeImage('b'), typeImage('c')];
  assert.deepEqual(codes(auditArticle(ranking, body(html), images, context())), ['source_card_unverifiable']);
  const fixed = html.replace('この記事の元データを', '同じテーマのデータを');
  assert.deepEqual(codes(auditArticle(ranking, body(fixed), images, context())), []);
});
