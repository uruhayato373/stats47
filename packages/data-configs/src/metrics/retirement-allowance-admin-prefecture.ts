import type { MetricConfig } from "../types";

export const retirementAllowanceAdminPrefecture: MetricConfig = {
  "key": "retirement-allowance-admin-prefecture",
  "title": "一般行政職 定年退職者 平均退職手当",
  "description": "都道府県の一般行政職員の定年退職者等の平均退職手当支給額",
  "unit": "千円",
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
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "一般行政職 定年退職者 平均退職手当ランキング都道府県【2024年】｜1位東京都（24,826千円）",
  "seoDescription": "2024年の一般行政職 定年退職者 平均退職手当の都道府県別ランキング。1位東京都（24,826千円）、最下位和歌山県（14,145千円）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
