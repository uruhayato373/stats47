import type { MetricConfig } from "../types";

export const singlePersonHouseholdOldPopulationRatio: MetricConfig = {
  "key": "single-person-household-old-population-ratio",
  "title": "65歳以上世帯員の単独世帯の割合",
  "description": "65歳以上世帯員の単独世帯数を一般世帯数で除して100を掛けた割合です。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
  "seoTitle": "65歳以上世帯員の単独世帯の割合ランキング都道府県【2020年】｜1位高知県（17.8％）",
  "seoDescription": "2020年の65歳以上世帯員の単独世帯の割合の都道府県別ランキング。1位高知県（17.8％）、最下位滋賀県（9.4％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
