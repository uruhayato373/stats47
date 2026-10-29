import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicHighSchoolRatio: MetricConfig = {
  "key": "public-high-school-ratio",
  "title": "公立高等学校割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E01303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
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
  "seoTitle": "公立高等学校割合ランキング都道府県【2024年】｜1位徳島県（91.7％）",
  "seoDescription": "2024年の公立高等学校割合の都道府県別ランキング。1位徳島県（91.7％）、最下位東京都（43.4％）で2.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
