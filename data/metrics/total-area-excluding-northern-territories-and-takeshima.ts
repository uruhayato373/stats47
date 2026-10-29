import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalAreaExcludingNorthernTerritoriesAndTakeshima: MetricConfig = {
  "key": "total-area-excluding-northern-territories-and-takeshima",
  "title": "総面積",
  "subtitle": "北方地域及び竹島を除く",
  "unit": "ｈａ",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B1101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
    ],
  },
  "seoTitle": "総面積ランキング都道府県【2024年】｜1位北海道（7,841,921ｈａ）",
  "seoDescription": "2024年の総面積の都道府県別ランキング。1位北海道（7,841,921ｈａ）、最下位香川県（187,686ｈａ）で41.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
