import type { MetricConfig } from '../../packages/data-configs/src/types';

import { DEFAULT_METRIC_PRESENTATION } from './defaults/presentation';

export const elderlyLivingAloneRate: MetricConfig = {
  key: 'elderly-living-alone-rate',
  title: '65歳以上人口に占める一人暮らしの割合',
  subtitle: '高齢者の独居率',
  description:
    '65歳以上の世帯員のいる単独世帯数（一人暮らしの65歳以上の人の数）を65歳以上人口で除して100を掛けた割合です。分母は一般世帯数ではなく、施設に入所している人を含む65歳以上の人口全体です。',
  note: '国勢調査の年（5年ごと）の値です。一般世帯数を分母にした「65歳以上世帯員の単独世帯の割合」とは別の指標です。',
  unit: '％',
  category: 'population',
  source: {
    kind: 'estat',
    statsDataId: '0000010101',
    axisRatio: {
      axis: 'cat01',
      numeratorCodes: ['A811105'],
      denominatorCodes: ['A1303'],
    },
    displayName: '社会・人口統計体系',
    url: 'https://www.stat.go.jp/data/ssds/index.htm',
  },
  entities: ['prefecture'],
  years: {
    years: [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020],
  },
  yearFormat: 'calendar',
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    colorScheme: 'interpolateBlues',
    colorSchemeType: 'sequential',
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  calculation: {
    isCalculated: false,
  },
  surveyId: 'census',
  isActive: true,
};
