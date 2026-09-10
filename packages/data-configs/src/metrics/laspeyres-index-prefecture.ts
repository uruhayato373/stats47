import type { MetricConfig } from "../types";

export const laspeyresIndexPrefecture: MetricConfig = {
  "key": "laspeyres-index-prefecture",
  "title": "ラスパイレス指数",
  "unit": "指数",
  "category": "administrativefinancial",
  "source": {
    "kind": "external",
    "fetcherKey": "local-public-employee-salary",
    "config": {
      "source": {
        "name": "地方公務員給与実態調査",
        "url": "https://www.soumu.go.jp/iken/kyuyo.html",
      },
      "note": "総務省報道発表PDFから手動取得。e-Stat APIでは2013年が最新のため自動取得不可",
    },
    "displayName": "地方公務員給与実態調査",
    "url": "https://www.soumu.go.jp/iken/kyuyo.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2012,
    "to": 2025,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdYlGn",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [],
  },
  "seoTitle": "ラスパイレス指数ランキング都道府県【2025年】｜1位静岡県（101.8）",
  "seoDescription": "2025年のラスパイレス指数の都道府県別ランキング。1位静岡県（101.8）、最下位青森県（96.8）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
