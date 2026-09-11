import type { MetricConfig } from "../types";

export const annualEmergencyDispatchesPer1000: MetricConfig = {
  "key": "annual-emergency-dispatches-per-1000",
  "title": "年間救急出動件数",
  "subtitle": "人口千人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "救急自動車による年間の救急出動件数を総人口で除し、人口千人当たりに換算した値。",
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
  },
  "seoTitle": "救急出動件数（人口千人当たり）ランキング都道府県",
  "seoDescription": "人口千人当たりの救急出動件数を都道府県別に比較。総数とは区別し、人口規模を揃えて地域差と経年変化を地図やグラフで確認できます。",
  "isActive": true,
};
