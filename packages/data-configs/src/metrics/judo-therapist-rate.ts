import type { MetricConfig } from "../types";

export const judoTherapistRate: MetricConfig = {
  "key": "judo-therapist-rate",
  "title": "人口10万対柔道整復師数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026940",
    "cdTab": "0140",
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
    ],
  },
  "seoTitle": "人口10万対柔道整復師数 都道府県ランキング【2020年】｜1位東京都（11,478.0人）",
  "seoDescription": "2020年の人口10万対柔道整復師数を都道府県別に比較。1位は東京都（11,478.0人）、最下位は鳥取県（93.0人）、最大と最小の差は123.4倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
