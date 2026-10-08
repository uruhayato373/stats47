import type { MetricConfig } from "../types";

export const primarySchoolCommuteTimeWeekday: MetricConfig = {
  "key": "primary-school-commute-time-weekday",
  "title": "小学生の通勤・通学の総平均時間",
  "subtitle": "在学者（10歳以上）のうち小学・男女計・平日の1日あたり",
  "note": "調査の行動分類は「通勤・通学」で、通学だけは分けられない。10歳以上が対象のため小学生は5・6年生のみで、通学しなかった人も0分として平均に含む。",
  "description": "社会生活基本調査（2021年）の在学者の生活時間表で、小学の在学者（男女計・平日）が1日のうち通勤・通学に費やした総平均時間。",
  "unit": "分",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003457319",
    "cdTab": "202108A07B06",
    "cdCat01": "2",
    "cdCat02": "0",
    "cdCat03": "1",
    "cdCat04": "0",
    "cdCat05": "04",
    "displayName": "社会生活基本調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003457319",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
