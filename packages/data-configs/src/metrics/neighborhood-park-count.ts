import type { MetricConfig } from "../types";

export const neighborhoodParkCount: MetricConfig = {
  "key": "neighborhood-park-count",
  "title": "近隣公園数",
  "subtitle": "総数",
  "unit": "箇所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H9103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "箇所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "箇所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "箇所/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "neighborhood-park-count",
  "seoTitle": "近隣公園数ランキング都道府県【2023年】｜1位北海道（504箇所）",
  "seoDescription": "2023年の近隣公園数の都道府県別ランキング。1位北海道（504箇所）、最下位鳥取県（17箇所）で29.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
