import { describe, expect, it } from 'vitest';

import analysisUnits from '../../../../data/surveys/analysis-units/kakei-chousa.json';
import {
  KAKEI_ANALYSES,
  validateKakeiAnalyses,
} from '../kakei-analysis-catalog';

const pages = new Map(
  KAKEI_ANALYSES.map((row) => [row.placement.pageId, { published: true }])
);
const metrics = new Map(
  KAKEI_ANALYSES.flatMap((row) =>
    row.placement.metricKey
      ? [
          [
            row.placement.metricKey,
            {
              statsDataId: row.source.statsDataId,
              filters: row.source.filters ?? {},
              latestYear: 2025,
            },
          ] as const,
        ]
      : []
  )
);

describe('家計調査の分析単位の台帳', () => {
  it('正本 data/surveys/analysis-units/kakei-chousa.json の 24 件を、記録の形のまま読む', () => {
    expect(analysisUnits.surveyId).toBe('kakei-chousa');
    expect(KAKEI_ANALYSES).toHaveLength(24);
    expect(KAKEI_ANALYSES).toEqual(analysisUnits.units);
    expect(new Set(KAKEI_ANALYSES.map((row) => row.id)).size).toBe(24);
    expect(KAKEI_ANALYSES[0]).toEqual({
      id: 'natto-city-spending',
      lensId: 'kakei-city-comparison',
      question: '納豆への年間支出は都市でどう違うか',
      source: {
        statsDataId: '0004023605',
        frequency: 'annual',
        household: 'two-plus',
        geography: 'capital-cities',
        axis: 'city',
        year: 2025,
        filters: { cdCat01: '010530030', cdCat02: '03' },
      },
      evidence: 'value-checked',
      placement: {
        pageId: 'ranking:natto-consumption-expenditure',
        form: 'ranking',
        state: 'configured',
        metricKey: 'natto-consumption-expenditure',
      },
    });
  });
  it('実値を確かめていない候補は表を採用済みにしない proposed のまま置く', () => {
    const unverified = KAKEI_ANALYSES.filter(
      (row) => row.evidence === 'metadata-checked'
    );
    for (const row of unverified) expect(row.placement.state).toBe('proposed');
  });
  it('出典の分類条件と公開先の参照が一意である', () => {
    expect(validateKakeiAnalyses(KAKEI_ANALYSES, { pages, metrics })).toEqual(
      []
    );
  });
  it('全国の年収層を都市比較として登録すると停止する', () => {
    const bad = {
      ...KAKEI_ANALYSES[7],
      source: {
        ...KAKEI_ANALYSES[7]!.source,
        geography: 'capital-cities' as const,
      },
    };
    expect(validateKakeiAnalyses([bad], { pages, metrics })).toContain(
      `${bad.id}: income class must use national geography`
    );
  });
  it('既存ランキングの表・分類コードのずれを検出する', () => {
    const row = KAKEI_ANALYSES[0]!;
    const badMetrics = new Map(metrics);
    badMetrics.set(row.placement.metricKey!, {
      statsDataId: row.source.statsDataId,
      filters: { cdCat01: 'wrong' },
      latestYear: 2025,
    });
    expect(
      validateKakeiAnalyses([row], { pages, metrics: badMetrics })
    ).toContain(`${row.id}: metric cdCat01 mismatch`);
  });
  it('同じデータの二重登録と非公開ページへの配置を検出する', () => {
    const row = KAKEI_ANALYSES[0]!;
    const hidden = new Map(pages);
    hidden.set(row.placement.pageId, { published: false });
    const errors = validateKakeiAnalyses(
      [row, { ...row, id: 'duplicate-natto' }],
      { pages: hidden, metrics }
    );
    expect(errors).toContain('duplicate-natto: duplicate source slice');
    expect(errors).toContain(
      `${row.id}: destination page is not published: ${row.placement.pageId}`
    );
  });
  it('公開済みの図には実値確認が必要で、metricを名乗れない', () => {
    const row = KAKEI_ANALYSES.find((item) => item.id === 'food-income-quintile')!;
    expect(row.placement.state).toBe('published');
    const bad = { ...row, evidence: 'metadata-checked' as const, placement: { ...row.placement, metricKey: 'fake-key' } };
    const errors = validateKakeiAnalyses([bad], { pages, metrics });
    expect(errors).toContain(`${row.id}: published output needs checked values and a chart`);
    expect(errors).toContain(`${row.id}: non-ranking output cannot claim a metric`);
  });
});
