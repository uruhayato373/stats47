import type { MetricConfig } from "../types";

export const manufacturingShipmentAmount: MetricConfig = {
  "key": "manufacturing-shipment-amount",
  "title": "製造品出荷額等",
  "subtitle": "総額",
  "description": "従業者4人以上の製造業事業所について、1年間の製造品出荷額、加工賃収入額、くず廃物の出荷額、その他収入額を合計した金額。",
  "note": "消費税、酒税、たばこ税、揮発油税、地方揮発油税を含む。2020年度以降は調査が年により切り替わり、2021年経済センサスは従来より幅広く事業所を把握しているため、時系列比較には注意が必要。",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3401",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "manufacturing-shipment-amount",
  "seoTitle": "製造品出荷額等ランキング都道府県【2023年】｜1位愛知県（58,021,789百万円）",
  "seoDescription": "2023年の製造品出荷額等の都道府県別ランキング。1位愛知県（58,021,789百万円）、最下位沖縄県（506,700百万円）で114.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
