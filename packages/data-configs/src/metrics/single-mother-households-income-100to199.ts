import type { MetricConfig } from "../types";

export const singleMotherHouseholdsIncome100to199: MetricConfig = {
  "key": "single-mother-households-income-100to199",
  "title": "所得100〜199万円の母子世帯数",
  "description": "世帯所得100〜199万円の母子世帯の推計世帯数。",
  "note": "2022年10月1日現在の就業構造基本調査。配偶者のいない母と18歳未満の子供から成る母子世帯で、父子世帯や他の同居世帯員がいる世帯は含まない。所得は2021年10月〜2022年9月に通常得ている世帯の年間収入（税込み・定期的な年金等を含む）。推計値は丸められ、総数には不詳等が含まれるため、6階級計と総数は一致しない。差額を不詳世帯数とみなさない。所得構成比は6階級の推計値合計を分母とし、相対的貧困率や平均所得には換算しない。",
  "unit": "世帯",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "2",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2022,
    "to": 2022
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
