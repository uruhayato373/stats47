import type { MetricConfig } from "../types";

export const marineAquacultureHarvest: MetricConfig = {
  "key": "marine-aquaculture-harvest",
  "title": "海面養殖業収獲量",
  "description": "海面または陸上の施設で海水を使用して水産動植物を集約的に育成し、収獲時の原形重量で合計した量です。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C312201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
  "seoTitle": "海面養殖業収獲量ランキング都道府県【2023年】｜1位北海道（114,359トン）",
  "seoDescription": "2023年の海面養殖業収獲量の都道府県別ランキング。1位北海道（114,359トン）、最下位奈良県（0トン）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
