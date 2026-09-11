import type { MetricConfig } from "../types";

export const nonprimaryEnterprisesUnder5Count: MetricConfig = {
  "key": "nonprimary-enterprises-under5-count",
  "title": "常用雇用者0〜4人の企業数",
  "description": "経済センサスの企業等に関する集計における、本所所在地別の常用雇用者0〜4人の企業数。会社企業と個人経営の合計。",
  "note": "2021年6月1日現在。非農林漁業（公務を除く）の会社企業と個人経営を合算し、会社以外の法人を除く。複数事業所企業は企業全体を本所所在地へ集計し、個人経営も同一経営者の複数事業所を一企業にまとめる。勤務県別の事業所・従業者数とは異なる。常用雇用者0〜4人は統計上の規模区分であり、法令上の中小企業・小規模企業の定義ではない。従業者数には個人業主、無給家族従業者、有給役員等を含むため、常用雇用者数とは異なる。",
  "unit": "企業等",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0004006264",
    "cdCat01": "CR",
    "axisSum": {
      "axis": "cat03",
      "codes": [
        "11",
        "2"
      ]
    },
    "displayName": "総務省「令和3年経済センサス‐活動調査」企業等に関する集計 第3-1表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004006264",
    "cdTab": "201-2021",
    "cdCat02": "01"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2021,
    "to": 2021
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
