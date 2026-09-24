import type { MetricConfig } from "../types";

export const nursesPer100kPopulation: MetricConfig = {
  "key": "nurses-per-100k-population",
  "title": "人口10万対看護師数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026841",
    "cdTab": "0310",
    "displayName": "衛生行政報告例",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/eisei_houkoku/20/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "人口10万対看護師数 都道府県ランキング【2020年】｜1位高知県（1,623.4人）",
  "seoDescription": "2020年の人口10万対看護師数を都道府県別に比較。1位は高知県（1,623.4人）、最下位は埼玉県（736.9人）、最大と最小の差は2.2倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
