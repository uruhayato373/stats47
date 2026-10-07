import type { MetricConfig } from "../types";

export const mainRoadPavingRate: MetricConfig = {
  "key": "main-road-paving-rate",
  "title": "主要道路舗装率",
  "unit": "％",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06406",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
    "to": 2023,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "主要道路舗装率 都道府県ランキング【2023年】｜1位高知県（100.0％）",
  "seoDescription": "2023年の主要道路舗装率を都道府県別に比較。1位は高知県（100.0％）、最下位は岩手県（92.1％）、最大と最小の差は1.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
