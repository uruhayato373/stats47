import type { MetricConfig } from "../types";

export const perCapitaDisasterRecoveryExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-capita-disaster-recovery-expenditure-pref-municipal",
  "title": "災害復旧費",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0332103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "disaster-recovery-expenses-prefecture",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
