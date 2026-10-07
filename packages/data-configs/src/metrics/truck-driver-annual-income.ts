import type { MetricConfig } from "../types";

export const truckDriverAnnualIncome: MetricConfig = {
  "key": "truck-driver-annual-income",
  "title": "営業用大型貨物自動車運転者の平均年収",
  "description": "賃金構造基本統計調査の一般労働者・男女計の営業用大型貨物自動車運転者について、6月のきまって支給する現金給与額を12倍し、前年1年間の賞与その他特別給与額を加えた推計年収。",
  "note": "大型車を除く営業用貨物、自家用貨物の運転者は別職種。6月の月例給与を年換算した税・社会保険料等控除前の標本平均で、個人の実年収ではない。",
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
    "cdCat02": "1614",
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
  "seoTitle": "営業用大型貨物自動車運転者の平均年収 都道府県ランキング【2023年】｜1位東京都（593.3万円）",
  "seoDescription": "2023年の営業用大型貨物自動車運転者の平均年収を都道府県別に比較。1位は東京都（593.3万円）、最下位は長崎県（347.4万円）、最大と最小の差は1.7倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true
};
