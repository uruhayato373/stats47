import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const passportIssuanceCountPerThousand: MetricConfig = {
  "key": "passport-issuance-count-per-thousand",
  "title": "一般旅券発行件数",
  "subtitle": "人口千人当たり",
  "unit": "件",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G0430501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2024,
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
  "seoTitle": "一般旅券発行件数ランキング都道府県【2024年】｜1位東京都（50.9件）",
  "seoDescription": "2024年の一般旅券発行件数の都道府県別ランキング。1位東京都（50.9件）、最下位秋田県（10.3件）で4.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
