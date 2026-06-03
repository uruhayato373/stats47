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
  "seoTitle": "小売業事業所数ランキング都道府県【2021】1位東京 vs 最下位鳥取で18.6倍の商業格差",
  "seoDescription": "全国の小売業はどこに集まる?──1位東京(87,895事業所)、2位大阪(55,351)、3位愛知(46,535)、最下位鳥取(4,733)で18.6倍の格差。経済センサス2021を地図とグラフで47都道府県比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
