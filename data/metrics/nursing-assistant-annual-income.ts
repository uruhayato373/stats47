import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nursingAssistantAnnualIncome: MetricConfig = {
  "key": "nursing-assistant-annual-income",
  "title": "看護助手の平均年収",
  "description": "看護助手の都道府県別平均年収。賃金構造基本統計調査に基づく。対象は一般労働者・男女計。",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "tabCombination": [
      { "cdTab": "08,40", "factor": 12 },
      { "cdTab": "12,44", "factor": 1 },
    ],
    "cdCat01": "01",
    "cdCat02": "1371",
  },
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
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
  "seoTitle": "看護助手の平均年収 都道府県ランキング【2023年】｜1位埼玉県（502.0万円）",
  "seoDescription": "2023年の看護助手の平均年収を都道府県別に比較。1位は埼玉県（502.0万円）、最下位は青森県（239.2万円）、最大と最小の差は2.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
