import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const jrFreightShipment: MetricConfig = {
  "key": "jr-freight-shipment",
  "title": "ＪＲ貨物発送量",
  "description": "貨物地域流動調査で、日本貨物鉄道株式会社（JR貨物）が年度中に各都道府県から発送した車扱貨物とコンテナ貨物の重量。",
  "note": "その他の鉄道事業者による貨物輸送は含まず、1988年度以降は無償輸送分も除く。到着量ではなく発送地側の輸送量。",
  "unit": "トン",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3702",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "fiscal",
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "トン/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "トン/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
