import type { MetricConfig } from "../types";

export const welfareOfficeIntellectualDisabilityConsultationsPer100k: MetricConfig = {
  "key": "welfare-office-intellectual-disability-consultations-per-100k",
  "title": "福祉事務所知的障害者相談実人員",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05204",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1976,
      1977,
      1978,
      1979,
      1980,
      1981,
      1982,
      1983,
      1984,
      1985,
      1986,
      2002,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "welfare-office-intellectual-disability-consultations",
  "seoTitle": "福祉事務所知的障害者相談実人員ランキング都道府県【2002年】｜1位東京都（439.1人）",
  "seoDescription": "2002年の福祉事務所知的障害者相談実人員の都道府県別ランキング。1位東京都（439.1人）、最下位石川県（42.5人）で10.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
