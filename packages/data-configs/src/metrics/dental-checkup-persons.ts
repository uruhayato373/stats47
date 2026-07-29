import type { MetricConfig } from "../types";

export const dentalCheckupPersons: MetricConfig = {
  "key": "dental-checkup-persons",
  "title": "歯科健診受診延人員",
  "subtitle": "総数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I2303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2021,
      2022,
      2023,
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
  "groupKey": "dental-checkup-persons",
  "seoTitle": "歯科健診受診延人員ランキング都道府県【2023年】｜1位東京都（501,290人）",
  "seoDescription": "2023年の歯科健診受診延人員の都道府県別ランキング。1位東京都（501,290人）、最下位徳島県（10,281人）で48.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
