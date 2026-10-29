import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const commerceIndustryExpenditureRatioPrefFinance: MetricConfig = {
  "key": "commerce-industry-expenditure-ratio-pref-finance",
  "title": "商工費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0311101",
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
  "seoTitle": "商工費割合ランキング都道府県【2022年】｜1位大阪府（22.82％）",
  "seoDescription": "2022年の商工費割合の都道府県別ランキング。1位大阪府（22.82％）、最下位埼玉県（4％）で5.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
