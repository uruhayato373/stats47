import type { MetricConfig } from "../types";

export const constructionEmployedUnder30: MetricConfig = {
  "key": "construction-employed-under30",
  "title": "建設業の30歳未満就業者数",
  "description": "国勢調査における常住地別の建設業の30歳未満就業者数。産業大分類D（建設業）、労働力状態は就業者総数。",
  "note": "2020年10月1日現在の常住地別。建設業の事業所所在地別従業者数、勤務県、許可業者数とは集計対象が異なる。産業が建設業と回答された15歳以上の就業者を対象とし、産業不詳・分類不能は含まない。年齢構成は技能水準や技能継承の成否を表さない。",
  "unit": "人",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "0",
    "cdCat03": "D",
    "cdCat04": "0",
    "displayName": "総務省「令和2年国勢調査」就業状態等基本集計 第4表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450610",
    "axisSum": {
      "axis": "cat02",
      "codes": [
        "01",
        "02",
        "03"
      ]
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2020,
    "to": 2020
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
