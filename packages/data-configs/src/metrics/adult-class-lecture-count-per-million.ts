import type { MetricConfig } from "../types";

export const adultClassLectureCountPerMillion: MetricConfig = {
  "key": "adult-class-lecture-count-per-million",
  "title": "成人一般学級・講座数",
  "unit": "学級･講座",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G03203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
    "decimalPlaces": 1,
    "displayUnit": "学級",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "学級･講座/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "学級･講座/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "成人一般学級・講座数ランキング都道府県【2020年】｜1位鳥取県（23,259.6学級･講座）",
  "seoDescription": "2020年の成人一般学級・講座数の都道府県別ランキング。1位鳥取県（23,259.6学級･講座）、最下位神奈川県（95.5学級･講座）で243.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
