import type { MetricConfig } from "../types";

export const householdsOnPublicAssistancePer1000: MetricConfig = {
  "key": "households-on-public-assistance-per-1000",
  "title": "生活保護被保護実世帯数",
  "unit": "世帯",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J01101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "世帯/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "世帯/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "households-on-public-assistance",
  "seoTitle": "生活保護被保護実世帯数ランキング都道府県【2023年】｜1位大阪府（53.13世帯）",
  "seoDescription": "2023年の生活保護被保護実世帯数の都道府県別ランキング。1位大阪府（53.13世帯）、最下位富山県（9.19世帯）で5.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
