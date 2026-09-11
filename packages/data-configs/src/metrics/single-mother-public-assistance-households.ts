import type { MetricConfig } from "../types";

export const singleMotherPublicAssistanceHouseholds: MetricConfig = {
  "key": "single-mother-public-assistance-households",
  "title": "生活保護を受ける母子世帯数",
  "description": "被保護者調査による、現に生活保護を受けた母子世帯数の年度内1か月平均。",
  "note": "2023年度平均。配偶者のいない65歳未満の女子と18歳未満のその子のみで構成される母子世帯。保護停止中の世帯を含まない。児童扶養手当の年度末受給者数とは単位・対象・時点が異なり、国勢調査母子世帯数との比率を受給率や貧困率と解釈しない。",
  "unit": "世帯",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdTab": "00001",
    "cdCat01": "J110201",
    "displayName": "社会・人口統計体系（原典：被保護者調査）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/J"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
