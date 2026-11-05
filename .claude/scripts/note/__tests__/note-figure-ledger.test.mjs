import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bodyImagesOf, countChangedValues, figureKindOf, isTieNotation, noteHtmlToMarkdown, rankingKeyOfBody, rankingKeyOfTargets, titleExtremeIssues, yearOfBody, yearOfTitle } from '../build-note-figure-ledger.mjs';

test('本文の画像を直前の見出しと結び、./ と外部 URL と重複を除く', () => {
  const md = '## 【コロプレス地図】分布\n![](./images/image-01.png)\n## 上位\n![a](images/image-02.png)\n![](https://x.test/a.png)\n![](images/image-01.png)';
  assert.deepEqual(bodyImagesOf(md), [
    { file: 'images/image-01.png', section: '【コロプレス地図】分布' },
    { file: 'images/image-02.png', section: '上位' },
  ]);
});

test('図の種類はファイル名、台帳の charts、見出しの順に決まる', () => {
  assert.equal(figureKindOf('images/boxplot-1200x630.png', []), 'ranking-boxplot');
  assert.equal(figureKindOf('images/ratio-chart.png', ['images/ratio-chart.png']), 'chart');
  assert.equal(figureKindOf('images/image-01.png', [], '【コロプレス地図】日本全国の分布', true), 'ranking-map');
});

test('指標に結ばれない記事の手順図は、見出しに地図とあっても統計の図に数えない', () => {
  assert.equal(figureKindOf('images/image-01.png', [], '地図の作り方', false), 'diagram');
});

test('stats47Targets は 1 指標だけを指すときに限って結ぶ', () => {
  assert.equal(rankingKeyOfTargets(['/ranking/a', '/areas/13000']), 'a');
  assert.equal(rankingKeyOfTargets(['/ranking/a', '/ranking/b']), null);
  assert.equal(rankingKeyOfTargets(undefined), null);
});

test('題名の年は 1 つだけのときに読み、桁の多い数字を年と取り違えない', () => {
  assert.equal(yearOfTitle('【2021年版】水泳をした人が多い県は？'), '2021');
  assert.equal(yearOfTitle('2010年と2020年の比較'), null);
  assert.equal(yearOfTitle('120232年'), null);
});

test('固定コピーの丸めの差は許し、それを超える差は県の数で返す', () => {
  const observed = new Map([['01000', 36.24], ['02000', 40]]);
  assert.equal(countChangedValues([{ area_code: '01000', value: 36.2 }], observed), 0);
  assert.equal(countChangedValues([{ area_code: '02000', value: 36.2 }], observed), 1);
  assert.equal(countChangedValues([{ area_code: '99000', value: 1 }], observed), null);
});

test('同値の県の通し番号は誤りに数えず、同値の範囲を外れる順位は残す', () => {
  const rows = [{ areaName: '東京都', value: 3 }, { areaName: '神奈川県', value: 2 }, { areaName: '大阪府', value: 2 }, { areaName: '福岡県', value: 1 }];
  assert.equal(isTieNotation('RANK_MISMATCH: 本文「大阪...3位」 → data: x=2位', rows), true);
  assert.equal(isTieNotation('INVERSE_RANK_MISMATCH: 本文「3位...大阪」 → data の3位は 不明', rows), true);
  assert.equal(isTieNotation('RANK_MISMATCH: 本文「大阪...4位」 → data: x=2位', rows), false);
  assert.equal(isTieNotation('RANK_MISMATCH: 本文「福岡...3位」 → data: x=4位', rows), false);
});

test('note.com の本文 HTML から見出しと画像を読み、画像の順と見出しを結ぶ', () => {
  const html = '<h2 name="a">【コロプレス地図】分布</h2><figure name="b"><img src="https://assets.st-note.com/x.png?w=1"><figcaption></figcaption></figure><p>東京都は1位</p>';
  const md = noteHtmlToMarkdown(html);
  assert.deepEqual(bodyImagesOf(md, { remote: true }), [{ file: 'https://assets.st-note.com/x.png', section: '【コロプレス地図】分布' }]);
  assert.match(md, /東京都は1位/);
});

test('題名に年が無い記事は、本文で最も多く書かれた、値のある年を使う', () => {
  assert.equal(yearOfBody('2023年の値。2023年と2020年を比べた。1999年の話。', ['2020', '2023']), '2023');
  assert.equal(yearOfBody('2020年と2023年', ['2020', '2023']), '2023');
  assert.equal(yearOfBody('年の記載なし', ['2020']), null);
});

test('【コロプレス地図】の見出しの図は、指標に結べない記事でも統計の図に数える', () => {
  assert.equal(figureKindOf('images/image-01.png', [], '【コロプレス地図】日本全国の分布', false), 'ranking-map');
});

test('本文の最初のランキングへのリンクを主指標にする', () => {
  assert.equal(rankingKeyOfBody('[財政](https://stats47.jp/ranking/fiscal-strength-index)\n[別](/ranking/other)'), 'fiscal-strength-index');
  assert.equal(rankingKeyOfBody(noteHtmlToMarkdown('<a href="https://stats47.jp/ranking/a-b">x</a>')), 'a-b');
  assert.equal(rankingKeyOfBody('リンクなし'), null);
});

test('題名の 1 位と最下位を今の値と照らし、同値は同じ順位として認める', () => {
  const rows = [{ areaName: '鹿児島県', value: 29.9 }, { areaName: '東京都', value: 18 }, { areaName: '愛知県', value: 16.3 }];
  assert.deepEqual(titleExtremeIssues('鹿児島県がトップ、東京は最下位。', rows), ['TITLE_EXTREME_MISMATCH: 題名「東京…最下位」 → data の最下位は 愛知']);
  assert.deepEqual(titleExtremeIssues('1位は鹿児島県｜愛知が最下位', rows), []);
  const tied = [{ areaName: '富山県', value: 1.3 }, { areaName: '広島県', value: 1.3 }, { areaName: '沖縄県', value: 0.5 }];
  assert.deepEqual(titleExtremeIssues('茶道 1位は広島県', tied), []);
});
