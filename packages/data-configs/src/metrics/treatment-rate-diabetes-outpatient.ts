import type { MetricConfig } from "../types";

export const treatmentRateDiabetesOutpatient: MetricConfig = {
  "key": "treatment-rate-diabetes-outpatient",
  "title": "糖尿病の受療率（外来）",
  "subtitle": "外来患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。糖尿病の受療率（外来）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "15",
    "cdCat03": "4",
    "areaAxis": {
      "axis": "cat02",
      "scheme": "seq-pref",
    },
    "displayName": "患者調査 第37表 傷病分類別受療率（糖尿病・外来）",
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
  "seoTitle": "糖尿病の受療率（外来）ランキング都道府県【2023年】｜1位山口県（246人（人口10万対））",
  "seoDescription": "2023年の糖尿病の受療率（外来）の都道府県別ランキング。1位山口県（246人（人口10万対））、最下位沖縄県（100人（人口10万対））で2.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
