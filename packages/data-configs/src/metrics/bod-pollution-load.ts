import type { MetricConfig } from "../types";

export const bodPollutionLoad: MetricConfig = {
  "key": "bod-pollution-load",
  "title": "BOD汚濁負荷量",
  "subtitle": "生化学的酸素要求量（BOD）の汚濁負荷量",
  "unit": "kg/日",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003225562",
    "cdCat01": "100",
    "cdCat02": "120",
    "displayName": "水質汚濁物質排出量総合調査",
    "url": "https://www.env.go.jp/water/impure/index.html",
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
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "kg/日/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "kg/日/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "BOD汚濁負荷量ランキング都道府県【2019年】｜1位佐賀県（65,654.4kg/日）",
  "seoDescription": "2019年のBOD汚濁負荷量の都道府県別ランキング。1位佐賀県（65,654.4kg/日）、最下位山梨県（555.1kg/日）で118.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
