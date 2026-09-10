import type { MetricConfig } from '../types';
import { healthyLifeSource } from '../provenance/official-theme-releases';

export const healthyLifeExpectancyFemale: MetricConfig = {
  key: 'healthy-life-expectancy-female',
  title: '健康寿命（女性）',
  subtitle: '日常生活に制限のない期間（女性）',
  unit: '年',
  category: 'socialsecurity',
  source: healthyLifeSource('female'),
  entities: ['prefecture'],
  years: {
    from: 2019,
    to: 2022,
  },
  yearFormat: 'calendar',
  visualization: {
    colorScheme: 'interpolateGreens',
    colorSchemeType: 'sequential',
    minValueType: 'data-min',
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 2,
  },
  calculation: { isCalculated: false },
  description: '健康上の問題で日常生活が制限されることなく生活できる期間の平均。厚生労働省の都道府県別推計値を示す。',
  note: '推計値には不確実性があり、原資料は95%信頼区間を示しています。小さな順位差や年差だけで健康状態の差を断定できません。',
  surveyScope: 'not-applicable',
  surveyScopeReason:
    '厚生労働科学研究の算定結果であり、独立した統計調査を原典としないため',
  seoTitle: '健康寿命（女性）ランキング都道府県',
  seoDescription: '都道府県別の女性の健康寿命を比較。2019年・2022年の推計値と原資料を確認できます。',
  isActive: true,
};
