import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const damagedVacantHousingRatio: MetricConfig = {
  "key": "damaged-vacant-housing-ratio",
  "title": "腐朽・破損のある空き家の割合",
  "description": "空き家のうち、屋根・外壁・柱などに腐朽や破損がある空き家の割合。住宅・土地統計調査の「空き家の種類、腐朽・破損の有無、建て方、構造別空き家数」から、腐朽・破損ありの空き家数を空き家の総数で割って求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021631",
    "cdTab": "03-2023",
    "cdCat02": "0",
    "cdCat03": "0",
    "cdCat04": "0",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021631",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004021631",
    "cdTab": "03-2023",
    "cdCat02": "0",
    "cdCat03": "0",
    "cdCat04": "0",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021631",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
