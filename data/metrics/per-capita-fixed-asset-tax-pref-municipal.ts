import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaFixedAssetTaxPrefMunicipal: MetricConfig = {
  "key": "per-capita-fixed-asset-tax-pref-municipal",
  "title": "固定資産税",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "denominator": "population",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D02202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "千円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "千円/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
