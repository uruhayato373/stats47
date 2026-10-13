import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { articleKeyOf, areaLabel, rankRows, spearman } from '../build-reference-note';
import { checkArticle } from '../check-reference-note.mjs';
import { denominatorFromName } from '../lib/estat-denominator';

const row = (areaCode: string, value: number) => ({ areaCode, areaName: areaCode, yearCode: '2024', value });

test('ties share the smaller rank and the order is by value desc', () => {
  const ranked = rankRows([row('01000', 5), row('02000', 9), row('03000', 9), row('04000', 1)]);
  assert.deepEqual(ranked.map((r) => [r.areaCode, r.rank]), [['02000', 1], ['03000', 1], ['01000', 3], ['04000', 4]]);
});

test('rank correlation is 1 for the same order, -1 for the reverse, on common prefectures only', () => {
  const a = rankRows([row('01000', 1), row('02000', 2), row('03000', 3)]);
  assert.equal(spearman(a, rankRows([row('01000', 10), row('02000', 20), row('03000', 30)])).rho, 1);
  assert.equal(spearman(a, rankRows([row('01000', 30), row('02000', 20), row('03000', 10)])).rho, -1);
  assert.equal(spearman(a, rankRows([row('01000', 1), row('02000', 2)])).n, 2);
});

test('capital-city values name the city so they are not read as the whole prefecture', () => {
  assert.equal(areaLabel({ capitalCity: true }, { areaCode: '28000', areaName: '兵庫県' }), '兵庫県(神戸市)');
  assert.equal(areaLabel({ capitalCity: true }, { areaCode: '13000', areaName: '東京都' }), '東京都(東京都区部)');
  assert.equal(areaLabel({ capitalCity: false }, { areaCode: '28000', areaName: '兵庫県' }), '兵庫県');
});

test('the denominator comes only from the e-Stat item name, never guessed', () => {
  assert.equal(denominatorFromName('#G01107_博物館数（人口100万人当たり）'), '人口100万人当たり');
  assert.equal(denominatorFromName('#A1101_総人口'), null);
});

test('article keys are stable per source and analysis number', () => {
  assert.equal(articleKeyOf({ sourceKey: 'prefecture-ranking-consumption', id: 'prefecture-ranking-consumption-2020-a33' }), 'b-ref-prc-a33');
  assert.equal(articleKeyOf({ sourceKey: 'kakei-marketing', id: 'kakei-marketing-2015-a02-09' }), 'b-ref-kakei-a02-09');
  assert.equal(articleKeyOf({ sourceKey: 'average-income-ranking', id: 'average-income-ranking-unknown-a05' }), 'b-ref-inc-a05');
});

function article(draft: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ref-note-test-'));
  mkdirSync(path.join(dir, 'images'));
  writeFileSync(path.join(dir, 'images', 'm.png'), '');
  writeFileSync(path.join(dir, 'chart-data.json'), JSON.stringify({
    question: '問い', metrics: [{ year: '2024', rows: [{ value: 25910 }, { value: 13746 }], summary: { ratio: 1.88 } }],
  }));
  writeFileSync(path.join(dir, 'data-provenance.json'), JSON.stringify({ estat: { statsDataId: '0003348240' } }));
  writeFileSync(path.join(dir, 'draft.md'), draft);
  return dir;
}
const draft = (body: string, title = '題名') => `---\ntitle: "${title}"\ndescription: "説明"\n---\n\n${body}\n\n## この問いへの答え\n\n答え。\n`;

test('the check passes numbers from chart-data / provenance, small integers and classification names', () => {
  const body = '![地図](images/m.png)\n2024年の1位は25,910gで最下位の1.88倍、3位までを見ます。統計表ID 0003348240、品目分類 (2020年改定)。';
  assert.deepEqual(checkArticle(article(draft(body))), []);
});

test('the check rejects numbers not in the data, leftover markers, copied questions and missing images', () => {
  assert.match(checkArticle(article(draft('差は12,165gです。'))).join(), /12,165/);
  assert.match(checkArticle(article(draft('<!-- WRITE:intro -->'))).join(), /執筆の印/);
  assert.match(checkArticle(article(draft('本文', '問い'))).join(), /問いの写し/);
  assert.match(checkArticle(article(draft('![x](images/none.png)'))).join(), /画像が無い/);
});
