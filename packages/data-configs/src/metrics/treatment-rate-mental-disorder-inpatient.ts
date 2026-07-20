import type { MetricConfig } from "../types";

export const treatmentRateMentalDisorderInpatient: MetricConfig = {
  "key": "treatment-rate-mental-disorder-inpatient",
  "title": "精神及び行動の障害の受療率（入院）",
  "subtitle": "入院患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。精神及び行動の障害の受療率（入院）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "16",
    "cdCat03": "1",
    "displayName": "患者調査 第37表 傷病分類別受療率（精神及び行動の障害・入院）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026105",
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
    ],
  },
  "seoTitle": "精神障害の入院受療率ランキング｜鹿児島は神奈川の4倍【2023】",
  "seoDescription": "精神及び行動の障害による入院受療率は都道府県で4倍の差があります──1位鹿児島県413、最下位神奈川県103（人口10万対）。地域差の背景と47都道府県の分布を2023年データで解説します。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
