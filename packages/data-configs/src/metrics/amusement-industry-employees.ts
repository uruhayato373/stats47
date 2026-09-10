import type { MetricConfig } from '../types';

export const amusementIndustryEmployees: MetricConfig = {
  "key": "amusement-industry-employees",
  "title": "娯楽業の従業者数",
  "description": "娯楽業の従業者数を都道府県別に比較します。事業所所在地別の2021年6月1日時点です。",
  "note": "2021年6月1日現在の民営事業所（外国の会社及び法人でない団体を除く）。事業所所在地別で、企業本所所在地別の経理表とは集計単位が異なります。従業者数は男女不詳を含むため男女の既知内訳だけの合計とは一致しません。日本標準産業分類の中分類80を対象とし、文化産業全体や地域GDPではありません。",
  "unit": "人",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0004005665",
    "cdTab": "113-2021",
    "cdCat01": "80",
    "cdCat02": "0",
    "displayName": "経済センサス‐活動調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004005665"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2021,
    "to": 2021
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
