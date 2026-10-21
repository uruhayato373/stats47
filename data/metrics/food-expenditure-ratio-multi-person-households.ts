import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const foodExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "food-expenditure-ratio-multi-person-households",
  "title": "食料費割合",
  "subtitle": "二人以上の世帯（社会・人口統計体系の指標）",
  "description": "二人以上の世帯の消費支出に占める食料費の割合。社会・人口統計体系の指標「#L02411 食料費割合（二人以上の世帯）」をそのまま使う。",
  "note": "同じ考え方の「エンゲル係数」(engel-coefficient、家計調査 年次表 0003348239 の県庁所在市・二人以上世帯の食料費÷消費支出) とは値が一致しない。2024年の47県の単純平均は本指標27.79％・エンゲル係数29.45％で、県ごとにも1.4〜2.3ポイントの差がある (2026-10-21 R2 の配信値で確認)。差の原因 (算定に使う期間・地域の範囲) は社会・人口統計体系の算定方法で未確認。記事ではどちらの系列かを書き、混ぜて比べない。",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02411",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "食料費割合ランキング都道府県【2024年】｜1位兵庫県（31.8％）",
  "seoDescription": "2024年の食料費割合の都道府県別ランキング。1位兵庫県（31.8％）、最下位栃木県（25.2％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
