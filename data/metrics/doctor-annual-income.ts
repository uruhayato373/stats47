import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const doctorAnnualIncome: MetricConfig = {
  "key": "doctor-annual-income",
  "title": "医師の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の医師について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "現金給与額は所得税・社会保険料等の控除前で、時間外勤務手当等を含む。6月の月例給与を年換算した標本平均であり、個々の医師の実年収を示すものではない。",
  "unit": "万円",
  "category": "socialsecurity",
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
    "cdCat02": "1121",
    "displayName": "賃金構造基本統計調査",
    "url": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2010,
    "to": 2023
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
  "seoTitle": "医師の平均年収 都道府県ランキング【2023年】｜1位沖縄県（1,853.8万円）",
  "seoDescription": "2023年の医師の平均年収を都道府県別に比較。1位は沖縄県（1,853.8万円）、最下位は石川県（935.4万円）、最大と最小の差は2.0倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true
};
