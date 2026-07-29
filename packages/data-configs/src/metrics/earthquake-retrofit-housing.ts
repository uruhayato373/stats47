import type { MetricConfig } from "../types";

export const earthquakeRetrofitHousing: MetricConfig = {
  "key": "earthquake-retrofit-housing",
  "title": "耐震工事をした住宅数（持ち家）",
  "unit": "住宅",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H2270",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2008,
    "to": 2008,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "住宅/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "住宅/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "耐震工事をした住宅数（持ち家）ランキング都道府県【2008年】｜1位東京都（88,900住宅）",
  "seoDescription": "2008年の耐震工事をした住宅数（持ち家）の都道府県別ランキング。1位東京都（88,900住宅）、最下位沖縄県（3,300住宅）で26.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
