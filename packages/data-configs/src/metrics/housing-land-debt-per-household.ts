import type { MetricConfig } from '../types';

export const housingLandDebtPerHousehold: MetricConfig = {
  key: 'housing-land-debt-per-household',
  title: '住宅・土地のための負債残高',
  subtitle: '2019年・総世帯1世帯当たり',
  description:
    '住宅・土地の購入や建築等に関する負債残高を、負債のない世帯も含む総世帯の平均で比較します。',
  note: '2019年全国家計構造調査の家計資産・負債に関する結果、表4-1。総世帯・全世帯・世帯主男女平均。住宅ローンを持つ世帯だけの平均ではなく、負債のない世帯も含みます。住宅・土地以外の負債や月賦・年賦を加えた金融負債総額と区別し、年間の返済額・返済負担率とはみなしません。千円単位の推計値のため内訳と総額には丸め差があり、都道府県の平均値を単純平均して全国値は作りません。',
  unit: '千円',
  category: 'economy',
  source: {
    kind: 'estat',
    statsDataId: '0003426532',
    cdTab: '04-2019',
    cdCat01: '0',
    cdCat02: '0',
    cdCat03: '0',
    cdCat04: '221',
    displayName: '全国家計構造調査',
    url: 'https://www.stat.go.jp/data/zenkokukakei/2019/index.html',
  },
  entities: ['prefecture'],
  years: { from: 2019, to: 2019 },
  yearFormat: 'calendar',
  display: { conversionFactor: 1, decimalPlaces: 0 },
  isActive: true,
};
