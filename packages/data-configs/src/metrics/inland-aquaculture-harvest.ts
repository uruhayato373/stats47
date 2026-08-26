import type { MetricConfig } from "../types";

export const inlandAquacultureHarvest: MetricConfig = {
  "key": "inland-aquaculture-harvest",
  "title": "内水面養殖業収獲量",
  "description": "一定区画の内水面または陸上で淡水を使用して育成し、食用目的で収獲した水産動植物の原形重量です。",
  "note": "自家用の食用分は含みますが、増殖用・養殖用の種苗販売量は含みません。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C312202",
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
  "seoTitle": "内水面養殖業収獲量ランキング都道府県【2023年】｜1位鹿児島県（7,966トン）",
  "seoDescription": "2023年の内水面養殖業収獲量の都道府県別ランキング。1位鹿児島県（7,966トン）、最下位沖縄県（0トン）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
