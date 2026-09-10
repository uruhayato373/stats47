import type { MetricConfig } from "../types";

export const singleFatherEmploymentRate: MetricConfig = {
  "key": "single-father-employment-rate",
  "title": "父子世帯の父の就業割合",
  "description": "母子・父子世帯のうち父子世帯について、親の労働力状態が判明している世帯を分母とする就業者の割合。",
  "note": "2020年10月1日国勢調査の常住地別。未婚・死別・離別の父親と未婚の20歳未満の子供のみから成る一般世帯。その他の世帯員がいる世帯を含まない。就業者÷（就業者＋完全失業者＋非労働力人口）×100で、労働力状態不詳を分母から除く。就業構造基本調査の母子所得は子供18歳未満で定義が異なる。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0003450643",
    "cdTab": "2020_16",
    "cdCat01": "1",
    "cdCat02": "00",
    "axisRatio": {
      "axis": "cat03",
      "numeratorCodes": [
        "11"
      ],
      "denominatorCodes": [
        "11",
        "12",
        "2"
      ]
    },
    "displayName": "総務省「令和2年国勢調査」就業状態等基本集計 第34-3表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450643"
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
    "decimalPlaces": 1
  },
  "isActive": true
};
