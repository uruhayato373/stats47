import type { MetricConfig } from "../types";

export const commuteByCar: MetricConfig = {
  "key": "commute-by-car",
  "title": "自宅外通勤・通学者数（自家用車）",
  "subtitle": "自家用車",
  "unit": "人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H730105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2010,
      2020,
    ],
  },
  "yearFormat": "fiscal",
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "自宅外通勤・通学者数（自家用車）ランキング都道府県【2020年】｜1位愛知県（1,903,679人）",
  "seoDescription": "2020年の自宅外通勤・通学者数（自家用車）の都道府県別ランキング。1位愛知県（1,903,679人）、最下位高知県（185,593人）で10.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
