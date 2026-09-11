import type { MetricConfig } from '../types';

export const vacantHousingForRent: MetricConfig = {
  key: 'vacant-housing-for-rent',
  title: '賃貸用の空き家',
  subtitle: '2023年10月1日・住宅及び世帯に関する基本集計',
  description: '賃貸用の空き家の都道府県別推計戸数。',
  note: '住宅・土地統計調査の標本調査による推計。全国と都道府県は100戸単位の丸めで公表され、総数と内訳の合計は丸めや不詳により一致しない場合があります。二次的住宅は別荘とその他を含み、別荘を重ねて加算しません。賃貸・売却用等を除く区分を、管理不全空家や特定空家の認定件数とはみなしません。原表34-1の建て方・構造・腐朽破損はすべて総数を使用します。',
  unit: '戸',
  category: 'construction',
  source: {
    kind: 'estat',
    statsDataId: '0004021660',
    cdTab: '03-2023',
    cdCat01: '0',
    cdCat02: '0',
    cdCat03: '0',
    cdCat04: '2',
    displayName: '住宅・土地統計調査',
    url: 'https://www.stat.go.jp/data/jyutaku/2023/index.html',
  },
  entities: ['prefecture'],
  years: {
    from: 2023,
    to: 2023,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
