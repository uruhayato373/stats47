import type { MetricConfig } from '../types';

export const fiveYearResidenceSameAddress: MetricConfig = {
  entities: ['prefecture'],
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
  key: 'five-year-residence-same-address',
  title: '5年前と同じ住所に住む5歳以上人口',
  description:
    '2020年10月1日現在の5歳以上常住者を、2015年10月1日の常住地と比較した人数。',
  note: '令和2年国勢調査・男女計・現住地による県帰属。5歳未満と年齢不詳を含まない。5年間に発生した転居回数ではなく、両時点の常住地の違いを表す。5年前の常住市区町村不詳と移動状況不詳は除外補完せず、内訳表で別掲。',
  unit: '人',
  category: 'population',
  years: {
    from: 2020,
    to: 2020,
  },
  source: {
    kind: 'estat',
    statsDataId: '0003447398',
    cdTab: '2020_01',
    cdCat01: '0',
    cdCat02: 'R1',
    cdCat03: '001',
    displayName: '総務省「令和2年国勢調査」移動人口の男女・年齢等集計 第1表',
    url: 'https://www.e-stat.go.jp/dbview?sid=0003447398',
  },
};
