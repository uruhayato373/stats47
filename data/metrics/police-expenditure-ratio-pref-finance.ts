import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const policeExpenditureRatioPrefFinance: MetricConfig = {
  "key": "police-expenditure-ratio-pref-finance",
  "title": "警察費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D03113",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "警察費割合ランキング都道府県【2022年】｜1位神奈川県（7.89％）",
  "seoDescription": "2022年の警察費割合の都道府県別ランキング。1位神奈川県（7.89％）、最下位岩手県（3.3％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
