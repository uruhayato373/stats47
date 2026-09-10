import type { MetricConfig } from "../types";

export const laundryBeautyBathIndustryEmployees: MetricConfig = {
  "key": "laundry-beauty-bath-industry-employees",
  "title": "洗濯・理容・美容・浴場業の従業者数",
  "description": "洗濯・理容・美容・浴場業の従業者数を都道府県別に比較する。",
  "note": "日本標準産業分類2013年改定の中分類78（洗濯・理容・美容・浴場業）。生活関連サービス全体ではなく、その他の生活関連サービス79・娯楽80を除く。2021年6月1日の民営事業所（外国の会社及び法人でない団体を除く）。事業所所在地別。男女計は性別不詳を含む。",
  "unit": "人",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004005665",
    "cdTab": "113-2021",
    "cdCat01": "78",
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
