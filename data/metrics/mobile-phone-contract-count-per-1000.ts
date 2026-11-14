import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const mobilePhoneContractCountPer1000: MetricConfig = {
  "key": "mobile-phone-contract-count-per-1000",
  "title": "携帯電話契約数",
  "subtitle": "人口千人当たり",
  "unit": "契約",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06310",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "携帯電話契約数ランキング都道府県【2023年】｜1位東京都（5,531.4契約）",
  "seoDescription": "2023年の携帯電話契約数の都道府県別ランキング。1位東京都（5,531.4契約）、最下位秋田県（992.8契約）で5.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
