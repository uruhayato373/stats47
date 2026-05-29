import type { MetricConfig } from "../types";

export const realDisposableIncome: MetricConfig = {
  "key": "real-disposable-income",
  "title": "実質可処分所得（物価補正後）",
  "description": "可処分所得を消費者物価地域差指数で除し100を乗じた実質値。物価の地域差を考慮した実質的な購買力を示す。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "calculated",
    "config": {},
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": true,
    "type": "ratio",
    "numeratorKey": "disposable-income-worker-households",
    "denominatorKey": "consumer-price-difference-index-overall",
  },
  "seoTitle": "実質可処分所得（物価補正後）ランキング都道府県【2024年】｜1位埼玉県（618,720円）",
  "seoDescription": "2024年の実質可処分所得（物価補正後）の都道府県別ランキング。1位埼玉県（618,720円）、最下位沖縄県（423,078円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
