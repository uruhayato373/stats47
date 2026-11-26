import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from '../../packages/data-configs/src/types';

export const heatstrokeDeathsPer100k: MetricConfig = {
  key: 'heatstroke-deaths-per-100k',
  title: '熱中症による死亡数',
  subtitle: '人口10万人当たり',
  denominator: { kind: 'population', per: 100000 },
  description: '人口動態統計（確定数）の熱中症による死亡数（heatstroke-deaths）を、同じ年の総人口（total-population）で割り、人口10万人当たりに換算した値。',
  note: '人口の多い県ほど死亡数が大きくなる実数の見え方を補正した値。年ごとの猛暑の強さで大きく変動し、小さな県では1年の死亡数が数人の増減でも順位が大きく動く。死亡数は住所地別の確定数、人口は同じ年の総人口（国勢調査の年は国勢調査、それ以外は人口推計）を使う。',
  unit: '人',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'calculated',
    config: {},
  },
  entities: ['prefecture'],
  years: {
    from: 2013,
    to: 2024,
  },
  yearFormat: 'calendar',
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 2,
  },
  calculation: {
    isCalculated: true,
    type: 'ratio',
    // 分子は実数 (人)、分母は総人口 (人)。10 万人当たりにする ×100000 は生成器が scaleFactor として適用する。
    scaleFactor: 100000,
    numeratorKey: 'heatstroke-deaths',
    denominatorKey: 'total-population',
    description: '熱中症による死亡数 ÷ 総人口 × 100,000。同じ年のデータ同士を割る。',
  },
  surveyId: 'vital-statistics',
  isActive: false,
};
