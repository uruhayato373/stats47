import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const totalProductionInThePrefecture: MetricConfig = {
  "key": "total-production-in-the-prefecture",
  "title": "県内総生産額",
  "subtitle": "総額",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C1121",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  // 2026-10-06: getStatsData (cdCat01=C1121) で 2011〜2021 年度に 48 地域 (47 都道府県 + 全国) の値があることを確認し、
  // 単年から広げた。分類名は全年度「県内総生産額（平成27年基準）」で同じ系列 (local-economy テーマの主指標)。
  "years": {
    "from": 2011,
    "to": 2021,
  },
  "yearFormat": "fiscal",
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "県内総生産額ランキング都道府県【2021年】｜1位東京都（113,685,917百万円）",
  "seoDescription": "2021年の県内総生産額の都道府県別ランキング。1位東京都（113,685,917百万円）、最下位鳥取県（1,926,339百万円）で59.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
