import type { MetricConfig } from "../types";

export const householdRatioWith65plus: MetricConfig = {
  "key": "household-ratio-with-65plus",
  "title": "65歳以上の世帯員のいる世帯割合",
  "description": "65歳以上の世帯員がいる世帯数を一般世帯数で除して100を掛けた割合です。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "65歳以上の世帯員のいる世帯割合ランキング都道府県【2020年】｜1位秋田県（57.5％）",
  "seoDescription": "2020年の65歳以上の世帯員のいる世帯割合の都道府県別ランキング。1位秋田県（57.5％）、最下位東京都（29.54％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
