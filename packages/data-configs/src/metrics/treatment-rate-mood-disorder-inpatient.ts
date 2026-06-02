import type { MetricConfig } from "../types";

export const treatmentRateMoodDisorderInpatient: MetricConfig = {
  "key": "treatment-rate-mood-disorder-inpatient",
  "title": "気分障害（うつ病を含む）の受療率（入院）",
  "subtitle": "入院",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。気分障害（うつ病を含む）の受療率（入院）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "config": {},
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人（人口10万対）/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人（人口10万対）/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人（人口10万対）/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "気分障害（うつ病を含む）の受療率（入院）ランキング都道府県【2023年】｜1位長崎県（60人（人口10万対））",
  "seoDescription": "2023年の気分障害（うつ病を含む）の受療率（入院）の都道府県別ランキング。1位長崎県（60人（人口10万対））、最下位岐阜県（12人（人口10万対））で5.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
