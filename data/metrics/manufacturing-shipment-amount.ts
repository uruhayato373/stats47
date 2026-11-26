import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import { KAWASAKI_MANUFACTURING_CORRECTIONS } from "./defaults/kawasaki-manufacturing-corrections";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const manufacturingShipmentAmount: MetricConfig = {
  "key": "manufacturing-shipment-amount",
  "title": "製造品出荷額等",
  "subtitle": "総額",
  "description": "従業者4人以上の製造業事業所について、1年間の製造品出荷額、加工賃収入額、くず廃物の出荷額、その他収入額を合計した金額。",
  "note": "消費税、酒税、たばこ税、揮発油税、地方揮発油税を含む。2020年以降は調査が年により切り替わり、令和3年経済センサス-活動調査（2020年の実績）は従来より幅広く事業所を把握しているため、時系列比較には注意が必要。川崎市・川崎区の1983年と1986年は、統計表の値に誤りがあるため川崎市公表の工業統計の値に置き換えている。",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "cityValueCorrections": KAWASAKI_MANUFACTURING_CORRECTIONS,
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "百万円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "百万円/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "manufacturing-shipment-amount-per-employee",
      },
      {
        "type": "series",
        "metric": "manufacturing-shipment-amount-per-establishment",
        "label": "1事業所当たり",
      },
    ],
  },
  "groupKey": "manufacturing-shipment-amount",
  "isActive": true,
};
