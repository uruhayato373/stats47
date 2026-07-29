import type { MetricConfig } from "../types";

export const treatmentRateSchizophreniaInpatient: MetricConfig = {
  "key": "treatment-rate-schizophrenia-inpatient",
  "title": "統合失調症の受療率（入院）",
  "subtitle": "入院患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。統合失調症の受療率（入院）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "17",
    "cdCat03": "1",
    "displayName": "患者調査 第37表 傷病分類別受療率（統合失調症・入院）",
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
  "seoTitle": "統合失調症の受療率（入院）ランキング都道府県【2023年】｜1位鹿児島県（266人（人口10万対））",
  "seoDescription": "2023年の統合失調症の受療率（入院）の都道府県別ランキング。1位鹿児島県（266人（人口10万対））、最下位滋賀県（55人（人口10万対））で4.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
