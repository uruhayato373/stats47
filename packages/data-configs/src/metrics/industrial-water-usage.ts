import type { MetricConfig } from "../types";

export const industrialWaterUsage: MetricConfig = {
  "key": "industrial-water-usage",
  "title": "工業用水量",
  "unit": "ｍ3／日",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3406",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2015,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
    "displayUnit": "m3",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｍ3／日/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｍ3／日/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "ｍ3／日/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "工業用水量ランキング都道府県【2015年】｜1位千葉県（16,122,494ｍ3／日）",
  "seoDescription": "2015年の工業用水量の都道府県別ランキング。1位千葉県（16,122,494ｍ3／日）、最下位奈良県（48,921ｍ3／日）で329.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
