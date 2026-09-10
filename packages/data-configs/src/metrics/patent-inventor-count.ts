import type { MetricConfig } from '../types';

export const patentInventorCount: MetricConfig = {
  "key": "patent-inventor-count",
  "title": "特許出願の延べ発明者数",
  "subtitle": "日本人によるもの・延べ人数",
  "description": "特許出願の延べ発明者数を都道府県別に比較します。件数や人数は研究の質・事業化成果を示すものではありません。",
  "note": "出願に記載された全発明者の延べ人数で、個人の実人数ではありません。PCT国内移行を含む2016年以降を掲載し、含まない2015年以前へ接続しません。",
  "unit": "人",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003398338",
    "cdCat01": "100",
    "displayName": "特許庁「特許行政年次報告書」",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003398338"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2016,
    "to": 2024
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
