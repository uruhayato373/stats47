import type { MetricConfig } from "../types";

export const kindergartenTeacherAnnualIncome: MetricConfig = {
  "key": "kindergarten-teacher-annual-income",
  "title": "幼稚園教員・保育教諭の平均年収",
  "description": "幼稚園教員・保育教諭の都道府県別平均年収。賃金構造基本統計調査に基づく。",
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
    "cdCat02": "1191",
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
  "seoTitle": "幼稚園教員・保育教諭の平均年収 都道府県ランキング【2022年】｜1位東京都（449.1万円）",
  "seoDescription": "2022年の幼稚園教員・保育教諭の平均年収を都道府県別に比較。1位は東京都（449.1万円）、最下位は秋田県（334.5万円）、最大と最小の差は1.3倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
