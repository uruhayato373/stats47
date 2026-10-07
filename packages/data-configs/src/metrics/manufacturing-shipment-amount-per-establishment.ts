import type { MetricConfig } from "../types";

export const manufacturingShipmentAmountPerEstablishment: MetricConfig = {
  "key": "manufacturing-shipment-amount-per-establishment",
  "title": "製造品出荷額等",
  "subtitle": "1事業所当たり",
  "description": "製造品出荷額等を製造業事業所数で割った、1事業所当たりの出荷額等。",
  "note": "事業所規模の違いを含む平均で、製造業の利益や付加価値額を示す指標ではない。経済センサス‐活動調査と経済構造実態調査では対象等が異なるため、時系列比較には注意が必要。",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C04404",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1986,
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
        1984,
        1985,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "manufacturing-shipment-amount",
  "seoTitle": "製造品出荷額等ランキング都道府県【2023年】｜1位山口県（3,904.5百万円）",
  "seoDescription": "2023年の製造品出荷額等の都道府県別ランキング。1位山口県（3,904.5百万円）、最下位沖縄県（515.5百万円）で7.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
