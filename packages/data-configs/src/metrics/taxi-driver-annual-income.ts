import type { MetricConfig } from "../types";

export const taxiDriverAnnualIncome: MetricConfig = {
  "key": "taxi-driver-annual-income",
  "title": "タクシー運転者の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計のタクシー運転者について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "タクシー以外の乗用自動車運転者は別職種。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
  "unit": "万円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003445758",
    "valueScale": 0.1,
    "cdCat01": "01",
    "tabCombination": [
      {
        "cdTab": "08",
        "factor": 12
      },
      {
        "cdTab": "12",
        "factor": 1
      }
    ],
    "cdCat02": "1612",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "タクシー運転者の平均年収 都道府県ランキング【2022年】｜1位大阪府（437.2万円）",
  "seoDescription": "2022年のタクシー運転者の平均年収を都道府県別に比較。1位は大阪府（437.2万円）、最下位は茨城県（208.4万円）、最大と最小の差は2.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true
};
