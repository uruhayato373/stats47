import type { MetricConfig } from "../types";

export const acupuncturistRate: MetricConfig = {
  "key": "acupuncturist-rate",
  "title": "人口10万対はり師数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026940",
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
  "seoTitle": "人口10万対はり師数ランキング都道府県【2020年】｜1位大阪府（181.6人）",
  "seoDescription": "2020年の人口10万対はり師数の都道府県別ランキング。1位大阪府（181.6人）、最下位青森県（32.8人）で5.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
