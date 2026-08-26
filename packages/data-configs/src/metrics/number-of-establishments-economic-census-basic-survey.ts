import type { MetricConfig } from "../types";

export const numberOfEstablishmentsEconomicCensusBasicSurvey: MetricConfig = {
  "key": "number-of-establishments-economic-census-basic-survey",
  "title": "事業所数",
  "subtitle": "経済センサス基礎調査",
  "description": "経済センサス‐基礎調査の調査日現在に、物の生産・販売やサービスの提供を継続して行う場所として把握された、民営、国、地方公共団体の事業所の総数。",
  "note": "農林漁家に属する個人経営事業所、家事サービス業、外国公務は対象外。2009年と2014年では日本標準産業分類の版が異なり、2014年は福島県の帰還困難区域・居住制限区域を含む調査区を除く。",
  "unit": "事業所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C2107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2009,
      2014,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "事業所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "事業所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "事業所数ランキング都道府県【2014年】｜1位東京都（662,360事業所）",
  "seoDescription": "2014年の事業所数の都道府県別ランキング。1位東京都（662,360事業所）、最下位鳥取県（27,885事業所）で23.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
