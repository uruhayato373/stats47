import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const hobbyParticipationRatePachinko: MetricConfig = {
  "key": "hobby-participation-rate-pachinko",
  "title": "パチンコの行動者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0003456573",
    "cdCat03": "31",
    "cdCat01": "0",
    "cdCat02": "99000",
    "displayName": "社会生活基本調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "パチンコの行動者率 都道府県ランキング【2021年】｜1位佐賀県（8.6％）",
  "seoDescription": "2021年のパチンコの行動者率を都道府県別に比較。1位は佐賀県（8.6％）、最下位は沖縄県（3.6％）、最大と最小の差は2.4倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
