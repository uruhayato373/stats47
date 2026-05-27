import type { MetricConfig } from "../types";

export const perCapitaFirefightingExpenditureTokyoMunicipal: MetricConfig = {
  "key": "per-capita-firefighting-expenditure-tokyo-municipal",
  "title": "消防費",
  "subtitle": "東京都・市町村財政合計",
  "unit": "千円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D03313",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
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
  "groupKey": "firefighting-expenses-prefecture",
  "seoTitle": "消防費ランキング都道府県【2022年】｜1位青森県（44.5千円）",
  "seoDescription": "2022年の消防費の都道府県別ランキング。1位青森県（44.5千円）、最下位神奈川県（13.3千円）で3.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
