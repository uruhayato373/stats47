import type { MetricConfig } from '../types';

export const realDisposableIncome: MetricConfig = {
  key: 'real-disposable-income',
  title: '実質可処分所得（物価補正後）',
  description:
    '県庁所在市等の勤労者世帯の月間可処分所得を消費者物価地域差指数で除し100を乗じた参考値です。所得と物価指数の地理範囲は同一ではなく、個々の世帯の購買力や時系列の実質成長率を直接示すものではありません。',
  unit: '円',
  category: 'economy',
  source: {
    kind: 'external',
    fetcherKey: 'calculated',
    config: {},
  },
  entities: ['prefecture'],
  // 分子 disposable-income-worker-households を 1975-2024 へ広げたのに合わせる。
  // 起点 2013 は分母 consumer-price-difference-index-overall の下限 (R2 実測 2013-2024) で、
  // 比が成立するのは両者が重なる年だけ。上限を 2024 に留めるのは分子と同じ理由 (seoTitle の実数)。
  years: {
    from: 2013,
    to: 2024,
  },
  yearFormat: 'fiscal',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  calculation: {
    isCalculated: true,
    type: 'ratio',
    numeratorKey: 'disposable-income-worker-households',
    denominatorKey: 'consumer-price-difference-index-overall',
    // 分母は「全国=100」の指数 (無次元) なので期間は混ざらない。×100 で円に戻す。
    scaleFactor: 100,
  },
  seoTitle:
    '実質可処分所得（物価補正後）ランキング都道府県【2024年】｜1位埼玉県（618,720円）',
  seoDescription:
    '2024年の実質可処分所得（物価補正後）の都道府県別ランキング。1位埼玉県（618,720円）、最下位沖縄県（423,078円）で1.5倍の格差。地図やグラフで47都道府県を比較。',
  isActive: true,
};
