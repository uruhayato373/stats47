import type { MetricConfig } from '../types';

export const singleHouseholdsAge65plusFemale: MetricConfig = {
  entities: ['prefecture'],
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
  key: 'single-households-age65plus-female',
  title: '65歳以上の女性単独世帯数',
  description:
    '国勢調査の一般世帯のうち、世帯主が65歳以上の女性である単独世帯数。',
  note: '2020年10月1日現在、常住地別、国籍・配偶関係総数。単独世帯は世帯員1人の一般世帯で、施設等の世帯を含まない。年齢不詳は65歳以上に配分せず、別の内訳表で表示する。',
  unit: '世帯',
  category: 'population',
  years: {
    from: 2020,
    to: 2020,
  },
  source: {
    kind: 'estat',
    statsDataId: '0003445081',
    cdTab: '2020_16',
    cdCat01: '2',
    cdCat02: '0',
    cdCat03: 'R2',
    cdCat04: '3',
    displayName: '総務省「令和2年国勢調査」人口等基本集計 第12-1表',
    url: 'https://www.e-stat.go.jp/dbview?sid=0003445081',
  },
};
