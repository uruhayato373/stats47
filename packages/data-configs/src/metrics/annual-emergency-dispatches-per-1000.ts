import type { MetricConfig } from "../types";

export const annualEmergencyDispatchesPer1000: MetricConfig = {
  "key": "annual-emergency-dispatches-per-1000",
  "title": "年間救急出動件数",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "救急自動車による年間の救急出動件数を総人口で除し、人口1,000人当たりに換算した値。",
  "note": "出動件数には急病、一般負傷、交通、転院搬送のほか、火災、自然災害、水難など消防庁が定める事故種別を含む。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I11201",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "年間救急出動件数ランキング都道府県【2023年】｜1位大阪府（78.7件）",
  "seoDescription": "2023年の年間救急出動件数の都道府県別ランキング。1位大阪府（78.7件）、最下位福井県（46.2件）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
