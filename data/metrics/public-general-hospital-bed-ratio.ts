import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicGeneralHospitalBedRatio: MetricConfig = {
  "key": "public-general-hospital-bed-ratio",
  "title": "公立一般病院病床数の割合",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I09402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
  "seoTitle": "公立一般病院病床数の割合ランキング都道府県【2023年】｜1位山形県（53.5％）",
  "seoDescription": "2023年の公立一般病院病床数の割合の都道府県別ランキング。1位山形県（53.5％）、最下位栃木県（10.6％）で5.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
