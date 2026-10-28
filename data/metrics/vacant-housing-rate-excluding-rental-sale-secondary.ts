import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const vacantHousingRateExcludingRentalSaleSecondary: MetricConfig = {
  "key": "vacant-housing-rate-excluding-rental-sale-secondary",
  "title": "賃貸・売却用及び二次的住宅を除く空き家率",
  "description": "総住宅数に占める、賃貸用・売却用・二次的住宅（別荘など）のいずれでもない空き家の割合。転勤・入院などで長く不在の住宅や、取り壊す予定の住宅などが入る。住宅・土地統計調査の「居住世帯の有無別住宅数」から求めた。",
  "note": "住宅・土地統計調査は標本調査で、市区と人口1万5千人以上の町村だけを集計する。2018年までの調査では「その他の住宅」と呼んでいた区分。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021421",
    "cdTab": "01-2023",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["221"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021421",
  },
  "citySource": {
    "kind": "estat",
    "statsDataId": "0004021421",
    "cdTab": "01-2023",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["221"],
      "denominatorCodes": ["0"],
    },
    "displayName": "住宅・土地統計調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004021421",
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
