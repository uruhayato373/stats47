import type { MetricConfig } from "../types";

export const futurePopulation: MetricConfig = {
  "key": "future-population",
  "title": "将来推計人口",
  "subtitle": "IPSS令和5年推計",
  "description": "国立社会保障・人口問題研究所（IPSS）による都道府県別の将来推計人口。2020年は国勢調査の実績値、2025〜2050年は5年ごとの推計値。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "external",
    "fetcherKey": "ssds",
    "config": {
      "source": {
        "name": "日本の地域別将来推計人口（令和5年推計）",
        "url": "https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp",
      },
    },
    "displayName": "日本の地域別将来推計人口（令和5年推計）",
    "url": "https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2050,
    "to": 2050,
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "将来推計人口ランキング都道府県【2050年】｜1位東京都（14,399,144人）",
  "seoDescription": "2050年の将来推計人口の都道府県別ランキング。1位東京都（14,399,144人）、最下位鳥取県（405,528人）で35.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
