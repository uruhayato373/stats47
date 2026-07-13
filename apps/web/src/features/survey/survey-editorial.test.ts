import { describe, expect, it } from 'vitest';

import { getSurveyEditorialContent } from './survey-editorial';

describe('getSurveyEditorialContent', () => {
  it('国勢調査の編集情報を返す', () => {
    const content = getSurveyEditorialContent('census');

    expect(content?.readerQuestions).toContainEqual({
      question: '30代前半男性の未婚率が高い都道府県は？',
      rankingKey: 'unmarried-ratio-male-30-34',
    });
    expect(content?.caveats.length).toBeGreaterThan(0);
  });

  it('賃金構造基本統計調査の編集情報を返す', () => {
    const content = getSurveyEditorialContent('wage-structure-survey');

    expect(content?.readerQuestions).toContainEqual({
      question: '大工の平均年収が高い都道府県は？',
      rankingKey: 'carpenter-annual-income',
    });
    // 代表導線は現行系列のみ (pre2019 を出さない — 事前監査の受入条件)
    for (const q of content?.readerQuestions ?? []) {
      expect(q.rankingKey).not.toMatch(/pre2019/);
    }
    expect(content?.caveats.length).toBeGreaterThan(0);
  });

  it('未定義の調査では現行表示へフォールバックできる', () => {
    expect(getSurveyEditorialContent('unknown-survey')).toBeNull();
  });
});
