import type { MetricConfig } from "../types";

export const retailEstablishmentsByPrefecture: MetricConfig = {
  "key": "retail-establishments-by-prefecture",
  "title": "小売業事業所数（経済センサス活動調査）",
  "unit": "事業所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003256",
    "cdCat01": "9",
    "cdCat02": "I2",
    "displayName": "小売業事業所数（経済センサス活動調査2021）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003256",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "seoTitle": "小売業が東京に集中する理由｜東京87,895店 vs 鳥取4,733店・18.6倍の格差 (2021)",
  "seoDescription": "小売業事業所は都市に偏る──東京87,895店 vs 最下位鳥取4,733店で18.6倍の格差。なぜこれほど集中するのか？2021年経済センサスを地図とグラフで47都道府県比較。人口補正後の順位も確認できます。",
  "isActive": true,
};
