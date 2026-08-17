import type { MetricConfig } from "../types";

export const homeCareWorkerAnnualIncome: MetricConfig = {
  "key": "home-care-worker-annual-income",
  "title": "訪問介護従事者の平均年収",
  "description": "訪問介護従事者の都道府県別平均年収。賃金構造基本統計調査に基づく。",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "tabCombination": [
      { "cdTab": "08", "factor": 12 },
      { "cdTab": "12", "factor": 1 },
    ],
    "cdCat01": "01",
    "cdCat02": "1362",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "display": {
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "訪問介護従事者の平均年収ランキング都道府県【2023年】｜1位鹿児島県（478.5万円）",
  "seoDescription": "2023年の訪問介護従事者の平均年収の都道府県別ランキング。1位鹿児島県（478.5万円）、最下位静岡県（263.5万円）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
