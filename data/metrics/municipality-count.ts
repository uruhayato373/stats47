import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from '../../packages/data-configs/src/types';

export const municipalityCount: MetricConfig = {
  key: 'municipality-count',
  title: '市町村数',
  unit: '市町村',
  category: 'administrativefinancial',
  source: {
    kind: 'estat',
    statsDataId: '0000010104',
    cdCat01: 'D110101',
    displayName: '社会・人口統計体系',
    url: 'https://www.stat.go.jp/data/ssds/index.htm',
  },
  entities: ['prefecture'],
  years: {
    from: 1998,
    to: 2024,
  },
  yearFormat: 'fiscal',
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  calculation: {
    isCalculated: false,
    normalizationOptions: [
      {
        denominator: { kind: 'population', per: 100000 },
        unit: '市町村/10万人',
        decimalPlaces: 2,
      },
      {
        denominator: { kind: 'area', per: 100 },
        unit: '市町村/100km²',
        decimalPlaces: 2,
      },
    ],
  },
  surveyScope: 'not-applicable',
  surveyScopeReason:
    '全国地方公共団体コードの行政台帳から市町村を数えた値で、統計調査を原典としないため',
  isActive: true,
};
