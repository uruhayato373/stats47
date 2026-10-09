import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roadLengthPerKm2: MetricConfig = {
  "key": "road-length-per-km2",
  "title": "道路実延長",
  "subtitle": "総面積1km²当たり",
  "unit": "km",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1985,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1983,
        1984,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "道路実延長ランキング都道府県【2023年】｜1位埼玉県（12.46km）",
  "seoDescription": "2023年の道路実延長の都道府県別ランキング。1位埼玉県（12.46km）、最下位北海道（1.15km）で10.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
