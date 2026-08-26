import type { MetricConfig } from "../types";

export const ratioNeverMarried15Plus: MetricConfig = {
  "key": "ratio-never-married-15-plus",
  "title": "未婚者割合",
  "subtitle": "15歳以上総数",
  "description": "国勢調査の15歳以上人口に占める、まだ結婚したことのない人の割合。",
  "note": "配偶関係は届出の有無ではなく実際の状態で区分する。死別・離別後に独身の人は未婚ではなく、それぞれ死別・離別に分類される。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0411001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 5,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "未婚者割合ランキング都道府県【2020年】｜1位東京都（32.68％）",
  "seoDescription": "2020年の未婚者割合の都道府県別ランキング。1位東京都（32.68％）、最下位秋田県（22.79％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
