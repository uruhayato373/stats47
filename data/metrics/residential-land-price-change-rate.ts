import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const residentialLandPriceChangeRate: MetricConfig = {
  "key": "residential-land-price-change-rate",
  "title": "住宅地地価変動率",
  "unit": "%",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C5501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdYlGn",
    "colorSchemeType": "diverging",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "land-price-change",
  "seoTitle": "住宅地地価変動率ランキング都道府県【2024年】｜1位沖縄県（5.8%）",
  "seoDescription": "2024年の住宅地地価変動率の都道府県別ランキング。1位沖縄県（5.8%）、最下位愛媛県（-1.2%）で-4.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
