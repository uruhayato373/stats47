import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fiscalStrengthIndexPrefecture: MetricConfig = {
  "key": "fiscal-strength-index-prefecture",
  "title": "財政力指数",
  "subtitle": "都道府県財政",
  "description": "都道府県の基準財政収入額を基準財政需要額で割った値について、過去3年間を平均した指数。",
  "note": "値が高いほど普通交付税算定上の留保財源が大きく、一般に財源の余裕があることを示す。単年度の収支や財政黒字率ではない。",
  "unit": "指数",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 5
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};
