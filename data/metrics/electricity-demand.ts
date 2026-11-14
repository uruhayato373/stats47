import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const electricityDemand: MetricConfig = {
  "key": "electricity-demand",
  "title": "電力需要量",
  "description": "電圧別の特別高圧・高圧・低圧（特定需要と一般需要）の需要実績を合わせた、年度計の電力量。出典は経済産業省資源エネルギー庁の「電気事業便覧」。都道府県別の需要実績は、電力調査統計が2016年4月実績分から取りまとめている。",
  "unit": "MWh",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2016,
    "to": 2023,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "MWh/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "MWh/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "電力需要量ランキング都道府県【2023年】｜1位東京都（75,521,853MWh）",
  "seoDescription": "2023年の電力需要量の都道府県別ランキング。1位東京都（75,521,853MWh）、最下位鳥取県（3,416,535MWh）で22.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
