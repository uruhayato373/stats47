import test from 'node:test';
import assert from 'node:assert/strict';
import { freezeQuestionRankingData, questionRankingCopy } from '../lib/question-cover-data.mjs';

const article = { key: 'a-sample', title: '【2021年版】農業産出額が最も多い県は？ 1位は北海道｜都道府県ランキング',
  stats47Targets: ['/ranking/sample'] };
function source() {
  return { rankingKey: 'sample', areaType: 'prefecture', partitions: [{ yearCode: '2021', count: 47,
    values: Array.from({ length: 47 }, (_,i) => ({ areaCode: `${String(i+1).padStart(2,'0')}000`,
      areaName: i === 0 ? '北海道' : `県${i}`, yearCode: '2021', value: 100 - i, unit: '百万円', rank: i+1 })) },
    { yearCode: '2026', count: 0, values: [] }] };
}

test('the frozen 47 values use the article year, not the latest available partition', () => {
  const result = freezeQuestionRankingData(article, source());
  assert.equal(result.year, '2021'); assert.equal(result.chartData.data.length, 47);
  assert.ok(result.chartData.data.every(r => r.year === '2021'));
  assert.equal(result.fixedCopyCreated, true); assert.equal(result.chartData.unit, '百万円');
});

test('missing prefectures, wrong years, non-numeric values, and mixed units stop generation', () => {
  for (const change of [s => s.partitions[0].values.pop(), s => s.partitions[0].values[1].areaCode = '01000',
    s => s.partitions[0].yearCode = '2026', s => s.partitions[0].values[1].value = null,
    s => s.partitions[0].values[1].unit = '円']) {
    const s = source(); change(s); assert.throws(() => freezeQuestionRankingData(article, s));
  }
});

test('all equal first places are retained even if the existing title names only one', () => {
  const s = source(); Object.assign(s.partitions[0].values[1], { value: 100, rank: 1, areaName: '青森県' });
  const data = freezeQuestionRankingData(article, s);
  assert.deepEqual(data.winners, ['北海道', '青森県']);
  assert.equal(questionRankingCopy(article, data.winners, data.year).answer, '同率1位は北海道・青森県');
  assert.throws(() => freezeQuestionRankingData({ ...article, title: article.title.replace('北海道', '県3') }, s));
});

test('a missing unit is recovered only after matching the complete fixed article data; original input stays intact', () => {
  const s = source(); const fixed = freezeQuestionRankingData(article, s).chartData; delete fixed.unit;
  const result = freezeQuestionRankingData(article, s, fixed);
  assert.equal(result.unitRepaired, true); assert.equal(result.fixedCopyCreated, false);
  assert.equal(result.chartData.unit, '百万円'); assert.equal(fixed.unit, undefined);
  fixed.data[2].value++;
  assert.throws(() => freezeQuestionRankingData(article, s, fixed), /frozen data differs/);
});

test('subject wrapping preserves every qualifier and particle, while keeping question and answer separate', () => {
  const long = { ...article, title: '【2022年版】1人当たり最終エネルギー消費量が最も多い県は？ 1位は大分県' };
  const copy = questionRankingCopy(long, ['大分県'], '2022');
  assert.equal(copy.subjectLines.join(''), '1人当たり最終エネルギー消費量が');
  assert.ok(copy.subjectLines.length <= 2); assert.equal(copy.question, '多い県は？');
  const reading = questionRankingCopy({ ...article, title: '【2021年版】マンガを読んだ人が多い県は？ 1位は北海道' }, ['北海道'], '2021');
  assert.equal(reading.subjectLines.join(''), 'マンガを'); assert.equal(reading.question, '読んだ人が多い県は？');
});
