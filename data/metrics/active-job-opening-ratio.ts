import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const activeJobOpeningRatio: MetricConfig = {
  "key": "active-job-opening-ratio",
  "title": "有効求人倍率",
  "description": "公共職業安定所における一般の月間有効求人数の年度計を、一般の月間有効求職者数の年度計で割った値。求職者1人当たりの求人数を表す。",
  "note": "新規学卒者とパートタイムを含まない。年度計は各月の有効求人・求職者を足した延べ数で、同じ求人・求職者が複数月に計上され得る。",
  "unit": "倍",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 1,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
