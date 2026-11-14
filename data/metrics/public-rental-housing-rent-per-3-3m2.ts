import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicRentalHousingRentPer33m2: MetricConfig = {
  "key": "public-rental-housing-rent-per-3-3m2",
  "title": "公営賃貸住宅の家賃",
  "subtitle": "1か月3.3m2当たり",
  "unit": "円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2014,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "公営賃貸住宅の家賃ランキング都道府県【2014年】｜1位東京都（3,647円）",
  "seoDescription": "2014年の公営賃貸住宅の家賃の都道府県別ランキング。1位東京都（3,647円）、最下位岡山県（832円）で4.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
