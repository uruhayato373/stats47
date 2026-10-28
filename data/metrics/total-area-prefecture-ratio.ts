import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalAreaPrefectureRatio: MetricConfig = {
  "key": "total-area-prefecture-ratio",
  "title": "総面積（都道府県面積に占める割合）",
  "subtitle": "都道府県比率",
  "unit": "％",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020302",
    "cdCat01": "#B01101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2024,
  },
  "yearFormat": "fiscal",
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
  },
  "seoTitle": "総面積（都道府県面積に占める割合）ランキング市区町村【2024年】｜1位富山県 富山市（29.23％）",
  "seoDescription": "2024年の総面積（都道府県面積に占める割合）の市区町村別ランキング。1位富山県 富山市（29.23％）、最下位北海道 札幌市 厚別区（0.03％）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
