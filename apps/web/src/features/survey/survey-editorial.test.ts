import { describe, expect, it } from 'vitest';

import {
  getSurveyEditorialContent,
  requiredSurveyReaderQuestionCount,
} from './survey-editorial';

describe('getSurveyEditorialContent', () => {
  it('active在庫が3件未満なら存在する導線数を必須数にする', () => {
    expect([0, 1, 2, 3, 5].map(requiredSurveyReaderQuestionCount)).toEqual([
      0, 1, 2, 3, 3,
    ]);
  });

  it('国勢調査の編集情報を返す', () => {
    const content = getSurveyEditorialContent('census');

    expect(content?.readerQuestions).toContainEqual({
      question: '40代前半（40〜44歳）男性の未婚率が高い都道府県は？',
      rankingKey: 'unmarried-ratio-male-40-44',
    });
    expect(content?.caveats.length).toBeGreaterThan(0);
  });

  it('家計調査は検索流入上位の品目と集計期間の違いを案内する', () => {
    const content = getSurveyEditorialContent('kakei-chousa');
    expect(content?.readerQuestions.map((item) => item.rankingKey)).toEqual([
      'natto-consumption-expenditure',
      'rice-consumption-quantity',
      'green-tea-consumption-quantity',
      'cup-noodles-consumption-expenditure',
      'actual-income-worker-households-per-month',
    ]);
    expect(content?.caveats).toContainEqual(expect.stringContaining('3年平均'));
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

  it('病院報告の3つのactiveランキングへ案内する', () => {
    const content = getSurveyEditorialContent('hospital-report');

    expect(content?.readerQuestions.map((item) => item.rankingKey)).toEqual([
      'hospital-bed-count',
      'bed-utilization-rate',
      'average-length-of-stay',
    ]);
    expect(content?.caveats).toContainEqual(
      expect.stringContaining('100％を超える場合があります')
    );
  });

  it('国民医療費の総額・1人当たり・入院分へ案内する', () => {
    const content = getSurveyEditorialContent('national-medical-expenditure');

    expect(content?.readerQuestions.map((item) => item.rankingKey)).toEqual([
      'national-medical-expense-total',
      'national-medical-expense-per-person',
      'national-medical-expense-inpatient',
    ]);
    expect(content?.caveats).toContainEqual(
      expect.stringContaining('正常な妊娠・分娩')
    );
  });

  it('未定義の調査では現行表示へフォールバックできる', () => {
    expect(getSurveyEditorialContent('unknown-survey')).toBeNull();
  });

  it('将来人口の原典を解決した2指標へ案内し、対象年と公表年を混同しない', () => {
    const content = getSurveyEditorialContent('population-projection');

    expect(content?.readerQuestions.map((item) => item.rankingKey)).toEqual([
      'future-population',
      'future-population-change-rate-2050',
    ]);
    expect(content?.summary).toContain('2050年の都道府県別人口');
    expect(content?.caveats).toContainEqual(
      expect.stringContaining('2050年は推計対象年')
    );
    expect(content?.caveats).toContainEqual(
      expect.stringContaining('1年間の増減率ではありません')
    );
  });
});

describe('家計調査のハブ', () => {
  it('収入・支出割合のハブ (household-survey) は品目別ハブへまとめ、編集定義を持たない', () => {
    expect(getSurveyEditorialContent('household-survey')).toBeNull();
  });
});

describe('都市別の値を集める調査の問い', () => {
  it('地域の表記が都市別の調査は、問いで「都道府県」「県」を名指ししない (値は県庁所在市で、県全体ではない)', () => {
    for (const surveyKey of ['kakei-chousa']) {
      const editorial = getSurveyEditorialContent(surveyKey);
      expect(editorial?.areaLabel).toContain('都市');
      for (const { question } of editorial?.readerQuestions ?? []) {
        expect(question).not.toMatch(/都道府県は|県は/);
      }
    }
  });
});
