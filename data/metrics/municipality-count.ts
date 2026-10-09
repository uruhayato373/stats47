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
        type: 'per_population',
        label: '人口10万人あたり',
        unit: '市町村/10万人',
        scaleFactor: 100000,
        decimalPlaces: 2,
      },
      {
        type: 'per_area',
        label: '面積100km²あたり',
        unit: '市町村/100km²',
        scaleFactor: 100,
        decimalPlaces: 2,
      },
    ],
  },
  surveyScope: 'not-applicable',
  surveyScopeReason:
    '全国地方公共団体コードの行政台帳から市町村を数えた値で、統計調査を原典としないため',
  seoTitle: '市町村数ランキング都道府県【2024年】｜1位北海道（179）',
  seoDescription:
    '2024年の市町村数の都道府県別ランキング。1位北海道（179）、最下位富山県（15）で11.9倍の格差。地図やグラフで47都道府県を比較。',
  isActive: true,
};
