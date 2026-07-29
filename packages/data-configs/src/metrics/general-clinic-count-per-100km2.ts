import type { MetricConfig } from "../types";

export const generalClinicCountPer100km2: MetricConfig = {
  "key": "general-clinic-count-per-100km2",
  "title": "一般診療所数",
  "subtitle": "面積100km²当たり",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0950103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1979,
    "to": 2023,
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
  },
  "groupKey": "general-clinic-count",
  "seoTitle": "一般診療所数ランキング都道府県【2023年】｜1位東京都（1,042.5施設）",
  "seoDescription": "2023年の一般診療所数の都道府県別ランキング。1位東京都（1,042.5施設）、最下位北海道（15施設）で69.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
