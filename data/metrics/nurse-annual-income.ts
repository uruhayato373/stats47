import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nurseAnnualIncome: MetricConfig = {
  "key": "nurse-annual-income",
  "title": "看護師の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の看護師について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "准看護師は別職種で含まない。額は税・社会保険料等の控除前で、6月の月例給与を年換算した標本平均のため、個人の実年収を示すものではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    "valueScale": 0.1,
    "cdCat01": "01",
    "tabCombination": [
      {
        "cdTab": "08,40",
        "factor": 12
      },
      {
        "cdTab": "12,44",
        "factor": 1
      }
    ],
    "cdCat02": "1133",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2020,
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "看護師の平均年収 都道府県ランキング【2023年】｜1位大阪府（568.1万円）",
  "seoDescription": "2023年の看護師の平均年収を都道府県別に比較。1位は大阪府（568.1万円）、最下位は宮崎県（416.3万円）、最大と最小の差は1.4倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true
};
