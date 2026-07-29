import type { MetricConfig } from "../types";

export const futurePopulationChangeRate2050: MetricConfig = {
  "key": "future-population-change-rate-2050",
  "title": "将来人口増減率",
  "subtitle": "2020年→2050年",
  "description": "2020年国勢調査人口に対する2050年推計人口の増減率（%）。IPSS令和5年推計に基づく。",
  "unit": "％",
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
    "colorScheme": "interpolateRdYlGn",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "将来人口増減率ランキング都道府県【2050年】｜1位東京都（2.5％）",
  "seoDescription": "2050年の将来人口増減率の都道府県別ランキング。1位東京都（2.5％）、最下位秋田県（-41.59％）で-0.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
