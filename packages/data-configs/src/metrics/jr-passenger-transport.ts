import type { MetricConfig } from "../types";

export const jrPassengerTransport: MetricConfig = {
  "key": "jr-passenger-transport",
  "title": "ＪＲ輸送人員",
  "description": "旅客地域流動調査で、年度中にJR鉄道が輸送した全旅客を都道府県別に推計した人数。",
  "note": "民鉄、地下鉄、路面電車などJR以外の鉄道・軌道は含まない。値が0でも、その都道府県で鉄道旅客輸送が全くないことを意味しない。",
  "unit": "千人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3704",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ＪＲ輸送人員ランキング都道府県【2023年】｜1位東京都（2,990,528.4千人）",
  "seoDescription": "2023年のＪＲ輸送人員の都道府県別ランキング。1位東京都（2,990,528.4千人）、最下位沖縄県（0千人）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
