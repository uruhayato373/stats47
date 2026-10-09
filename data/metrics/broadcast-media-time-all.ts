import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const broadcastMediaTimeAll: MetricConfig = {
  "key": "broadcast-media-time-all",
  "title": "テレビ・ラジオ・新聞・雑誌の総平均時間",
  "subtitle": "10歳以上・男女計・週全体の1日あたり",
  "note": "有業者・無業者などの区分をせず、10歳以上の全員を対象にした総平均時間で、その行動をしなかった人も0分として平均に含む。テレビ・ラジオ・新聞・雑誌は調査上1つの行動分類で、4種類を別々には取れない。",
  "description": "社会生活基本調査（2021年）の生活時間表で、10歳以上の男女計・週全体について、1日のうちテレビ・ラジオ・新聞・雑誌に費やした総平均時間。",
  "unit": "分",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0003457337",
    "cdTab": "202108A07B06",
    "cdCat01": "1",
    "cdCat02": "99000",
    "cdCat03": "0",
    "cdCat04": "12",
    "displayName": "社会生活基本調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003457337",
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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
