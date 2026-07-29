import type { MetricConfig } from "../types";

export const perCapitaKenminShotokuH17: MetricConfig = {
  "key": "per-capita-kenmin-shotoku-h17",
  "title": "1人当たり県民所得",
  "subtitle": "H17年基準",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2014,
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
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "1人当たり県民所得ランキング都道府県【2014年】｜1位東京都（4,512千円）",
  "seoDescription": "2014年の1人当たり県民所得の都道府県別ランキング。1位東京都（4,512千円）、最下位沖縄県（2,129千円）で2.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
