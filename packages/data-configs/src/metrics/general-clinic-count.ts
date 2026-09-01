import type { MetricConfig } from "../types";

export const generalClinicCount: MetricConfig = {
  "key": "general-clinic-count",
  "title": "一般診療所数",
  "subtitle": "総数",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I5102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2022,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "general-clinic-count",
  "seoTitle": "一般診療所数ランキング都道府県【2023年】｜1位東京都（14,894施設）",
  "seoDescription": "2023年の一般診療所数の都道府県別ランキング。1位東京都（14,894施設）、最下位鳥取県（474施設）で31.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
