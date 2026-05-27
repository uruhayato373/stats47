import type { MetricConfig } from "../types";

export const childWelfareFacilityStaffPer100k: MetricConfig = {
  "key": "child-welfare-facility-staff-per-100k",
  "title": "児童福祉施設等従事者数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J03501",
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
  "seoTitle": "児童福祉施設等従事者数ランキング都道府県【2023年】｜1位沖縄県（238.5人）",
  "seoDescription": "2023年の児童福祉施設等従事者数の都道府県別ランキング。1位沖縄県（238.5人）、最下位新潟県（67.5人）で3.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
