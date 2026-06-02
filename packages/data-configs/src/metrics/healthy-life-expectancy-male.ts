import type { MetricConfig } from "../types";

export const healthyLifeExpectancyMale: MetricConfig = {
  "key": "healthy-life-expectancy-male",
  "title": "健康寿命（男性）",
  "subtitle": "男性",
  "unit": "年",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "config": {
      "source": {
        "name": "厚生労働科学研究費補助金（健康安全・危機管理対策総合研究事業）",
        "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou/kenkou/index.html",
      },
      "estat": {
        "statsDataId": "0000010109",
        "cdCat01": "I1601",
        "statName": "社会・人口統計体系 I 健康・医療",
      },
    },
    "displayName": "厚生労働科学研究費補助金（健康安全・危機管理対策総合研究事業）",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou/kenkou/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "年/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "年/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "年/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "健康寿命（男性）ランキング都道府県【2019年】｜1位大分県（73.72年）",
  "seoDescription": "2019年の健康寿命（男性）の都道府県別ランキング。1位大分県（73.72年）、最下位岩手県（71.39年）で1.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
