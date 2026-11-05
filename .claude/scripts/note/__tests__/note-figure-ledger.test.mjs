import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bodyImagesOf, countChangedValues, figureKindOf, rankingKeyOfTargets, yearOfTitle } from '../build-note-figure-ledger.mjs';

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
