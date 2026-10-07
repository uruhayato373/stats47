import type { MetricConfig } from "../types";

export const totalAreaExcludingNorthernTerritoriesAndTakeshima: MetricConfig = {
  "key": "total-area-excluding-northern-territories-and-takeshima",
  "title": "総面積",
  "subtitle": "北方地域及び竹島を除く",
  "unit": "ｈａ",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B1101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1989,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
    ],
  },
  "seoTitle": "総面積ランキング都道府県【2024年】｜1位北海道（7,841,921ｈａ）",
  "seoDescription": "2024年の総面積の都道府県別ランキング。1位北海道（7,841,921ｈａ）、最下位香川県（187,686ｈａ）で41.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
