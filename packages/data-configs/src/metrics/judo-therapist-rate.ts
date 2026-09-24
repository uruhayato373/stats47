import type { MetricConfig } from "../types";

export const judoTherapistRate: MetricConfig = {
  "key": "judo-therapist-rate",
  "title": "人口10万対柔道整復師数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026940",
    "cdTab": "0180",
    "cdCat01": "100",
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
  "seoTitle": "人口10万対柔道整復師数 都道府県ランキング【2020年】｜1位大阪府（105.5人）",
  "seoDescription": "2020年の人口10万対柔道整復師数を都道府県別に比較。1位は大阪府（105.5人）、最下位は鳥取県（16.8人）、最大と最小の差は6.3倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
