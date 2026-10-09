import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from '../../packages/data-configs/src/types';

export const retailEmployees: MetricConfig = {
  key: 'retail-employees',
  title: '小売業従業者数',
  description: '小売業の事業所で業務に従事する人数を都道府県別に比較する。',
  note: '社会・人口統計体系C350302の2021年度行。個人業主・無給家族従業者・有給役員・常用雇用者を含む調査日現在の人数で、卸売業を含む商業従業者総数C3503とは異なる。年度は原表の表示に合わせ、年度末人数や年間平均人数とはしない。過去年には調査対象の違いがあるため、この系列は2021年度だけを掲載する。',
  unit: '人',
  category: 'commercial',
  source: {
    kind: 'estat',
    statsDataId: '0000010103',
    cdTab: '00001',
    cdCat01: 'C350302',
    displayName: '社会・人口統計体系',
    url: 'https://www.e-stat.go.jp/dbview?sid=0000010103',
  },
  entities: ['prefecture'],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  years: { from: 2021, to: 2021 },
  yearExclusions: [
    {
      years: [1976, 1979, 1982, 1985, 1988, 1991, 1994, 1997, 1999, 2002, 2004, 2007, 2011, 2014, 2016],
      reason: "過去年は調査対象が違い 2021 年度と同じ系列として比べられないため、この系列は 2021 年度だけを掲載する (note のとおり)",
    },
  ],
  yearFormat: 'fiscal',
  display: { conversionFactor: 1, decimalPlaces: 0 },
  isActive: true,
};
