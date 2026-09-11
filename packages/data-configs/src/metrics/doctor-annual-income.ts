import type { MetricConfig } from "../types";

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
        "cdTab": "08",
        "factor": 12
      },
      {
        "cdTab": "12",
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
  "seoTitle": "医師の平均年収 都道府県ランキング【2022年】｜1位千葉県（2,128.8万円）",
  "seoDescription": "2022年の医師の平均年収を都道府県別に比較。1位は千葉県（2,128.8万円）、最下位は和歌山県（921.8万円）、最大と最小の差は2.3倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true
};
