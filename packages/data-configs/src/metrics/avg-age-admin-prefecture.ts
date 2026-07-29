import type { MetricConfig } from "../types";

export const avgAgeAdminPrefecture: MetricConfig = {
  "key": "avg-age-admin-prefecture",
  "title": "一般行政職 平均年齢",
  "description": "都道府県の一般行政職員の平均年齢",
  "unit": "歳",
  "category": "administrativefinancial",
  "source": {
    "kind": "external",
    "fetcherKey": "local-public-employee-salary",
    "config": {
      "source": {
        "name": "地方公務員給与実態調査",
        "url": "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/teiin-kyuuyo02.html",
      },
    },
    "displayName": "地方公務員給与実態調査",
    "url": "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/teiin-kyuuyo02.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2012,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "歳/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "歳/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "一般行政職 平均年齢ランキング都道府県【2024年】｜1位長野県（45歳）",
  "seoDescription": "2024年の一般行政職 平均年齢の都道府県別ランキング。1位長野県（45歳）、最下位千葉県（40.1歳）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
