import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const actualOvernightGuests: MetricConfig = {
  "key": "actual-overnight-guests",
  "title": "実宿泊者数",
  "description": "実宿泊者数（従業者数10人以上の宿泊施設、全施設タイプ合計、宿泊旅行統計調査）。各月に宿泊施設で宿泊手続をした人数で、子供や乳幼児も1人と数える。",
  "note": "1回の宿泊手続で何泊しても1人と数えるため、泊数分を数える延べ宿泊者数より小さくなる。年の値は月ごとの人数の合計で、同じ人が別の月や別の施設に泊まると重ねて数える。社会・人口統計体系は従業者数10人以上の宿泊施設の結果を収める。観光庁が公表する値は従業者数10人未満の施設を含む推計値のため、この値より大きい。",
  "unit": "人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G7103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万人",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
