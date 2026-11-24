import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nonRegularEmploymentRate: MetricConfig = {
  "key": "non-regular-employment-rate",
  "title": "非正規雇用率",
  "unit": "%",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008452",
    "cdCat01": "0",
    "cdCat02": "00",
    "cdCat03": "0",
    "axisRatio": {
      "axis": "cat04",
      "numeratorCodes": ["322"],
      "denominatorCodes": ["321", "322"],
    },
  },
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "calculation": {
    // 取り込み時に axisRatio で確定するので実行時計算ではない。
    // 旧: formula "cat04_322 / (cat04_321 + cat04_322)" (自由文字列・実行されない)
    "isCalculated": false,
  },
  "isActive": true,
};
