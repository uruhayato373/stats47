import type { MetricConfig } from "../types";

export const penalCodeOffensesRecognizedPer1000: MetricConfig = {
  "key": "penal-code-offenses-recognized-per-1000",
  "title": "刑法犯認知件数",
  "subtitle": "人口1000人当たり（更新）",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "犯罪統計の刑法犯総数（交通業過を除く）の認知件数を総人口で除し、人口1,000人当たりに換算した値。",
  "note": "認知件数は、被害の届出、告訴、告発などを端緒として警察が犯罪の発生を認知した事件数であり、未認知の事件は含まれない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
    "decimalPlaces": 2,
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
  "groupKey": "criminal-recognition-count",
  "seoTitle": "刑法犯認知件数ランキング都道府県【2023年】｜1位大阪府（9.15件）",
  "seoDescription": "2023年の刑法犯認知件数の都道府県別ランキング。1位大阪府（9.15件）、最下位岩手県（2.46件）で3.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
