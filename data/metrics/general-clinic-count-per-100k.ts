import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const generalClinicCountPer100k: MetricConfig = {
  "key": "general-clinic-count-per-100k",
  "title": "一般診療所数",
  "subtitle": "人口10万人当たり",
  "description": "医療施設調査で一般診療所に区分された施設数を、総人口で除して人口10万人当たりに換算した値です。",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "general-clinic-count",
  "seoTitle": "一般診療所数ランキング都道府県【2023年】｜1位和歌山県（113施設）",
  "seoDescription": "2023年の一般診療所数の都道府県別ランキング。1位和歌山県（113施設）、最下位埼玉県（61.8施設）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
