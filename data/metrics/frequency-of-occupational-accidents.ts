import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const frequencyOfOccupationalAccidents: MetricConfig = {
  "key": "frequency-of-occupational-accidents",
  "title": "労働災害発生の頻度",
  "unit": "（件/百万時間）",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F08201",
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
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "労働災害発生の頻度ランキング都道府県【2023年】｜1位高知県（3.7）",
  "seoDescription": "2023年の労働災害発生の頻度の都道府県別ランキング。1位高知県（3.7）、最下位徳島県（0.97）で3.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
