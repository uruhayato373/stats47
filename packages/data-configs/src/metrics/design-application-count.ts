import type { MetricConfig } from '../types';

export const designApplicationCount: MetricConfig = {
  "key": "design-application-count",
  "title": "意匠出願件数",
  "subtitle": "日本人によるもの・筆頭出願人住所別",
  "description": "意匠出願件数を都道府県別に比較します。件数や人数は研究の質・事業化成果を示すものではありません。",
  "note": "筆頭出願人の住所により都道府県に帰属します。企業の研究拠点所在地とは限りません。日本国籍で県が特定できない「その他」および外国籍は47県比較に含めません。国際意匠登録出願を含みます。",
  "unit": "件",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003398336",
    "cdCat01": "100",
    "cdCat02": "270",
    "displayName": "特許庁「特許行政年次報告書」",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003398336"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2013,
    "to": 2024
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
