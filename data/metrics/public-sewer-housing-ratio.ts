import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicSewerHousingRatio: MetricConfig = {
  "key": "public-sewer-housing-ratio",
  "title": "公共下水道のある住宅の割合",
  "description": "住宅のうち、公共下水道に接続している住宅の割合。住宅・土地統計調査の「住宅の所有の関係、建築の時期、公共下水道の有無別住宅数」から、公共下水道ありの住宅数を総数で割って求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。推計値の丸めで割合が100%をわずかに超える自治体は順位から除く。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004025576",
    "cdTab": "01-2023",
    "cdCat01": "0",
    "cdCat03": "00",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025576",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004025576",
    "cdTab": "01-2023",
    "cdCat01": "0",
    "cdCat03": "00",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004025576",
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
    "colorScheme": "interpolateBlues",
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
