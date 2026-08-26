import type { MetricConfig } from "../types";

export const fishCatch: MetricConfig = {
  "key": "fish-catch",
  "title": "漁獲量",
  "description": "海面漁業と内水面漁業で採捕された水産動植物を、採捕時の原形重量で合計した量です。",
  "note": "養殖業の収獲量は含みません。内水面漁業は調査対象となる河川・湖沼の範囲が時期により異なるため、長期比較には注意が必要です。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3121",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery",
  "seoTitle": "漁獲量ランキング都道府県【2023年】｜1位北海道（850,981トン）",
  "seoDescription": "2023年の漁獲量の都道府県別ランキング。1位北海道（850,981トン）、最下位奈良県（0トン）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
