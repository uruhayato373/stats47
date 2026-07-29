import type { MetricConfig } from "../types";

export const avgSalaryPolicePrefecture: MetricConfig = {
  "key": "avg-salary-police-prefecture",
  "title": "警察職 平均給与月額",
  "description": "都道府県の警察職員の平均給与月額（給料+諸手当）",
  "unit": "円",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "警察職 平均給与月額ランキング都道府県【2024年】｜1位東京都（520,847円）",
  "seoDescription": "2024年の警察職 平均給与月額の都道府県別ランキング。1位東京都（520,847円）、最下位長野県（371,845円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
