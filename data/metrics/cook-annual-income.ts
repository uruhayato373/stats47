import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const cookAnnualIncome: MetricConfig = {
  "key": "cook-annual-income",
  "title": "飲食物調理従事者の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の飲食物調理従事者について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "自営業者の所得統計ではなく、雇用される一般労働者の賃金統計。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "cdCat01": "01",
    "tabCombination": [
      { "cdTab": "08,40", "factor": 12 },
      { "cdTab": "12,44", "factor": 1 },
    ],
    "cdCat02": "1391",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "飲食物調理従事者の平均年収 都道府県ランキング【2023年】｜1位東京都（423.6万円）",
  "seoDescription": "2023年の飲食物調理従事者の平均年収を都道府県別に比較。1位は東京都（423.6万円）、最下位は長崎県（273.5万円）、最大と最小の差は1.5倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
