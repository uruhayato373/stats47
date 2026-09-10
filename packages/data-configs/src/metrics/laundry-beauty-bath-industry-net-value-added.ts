import type { MetricConfig } from "../types";

export const laundryBeautyBathIndustryNetValueAdded: MetricConfig = {
  "key": "laundry-beauty-bath-industry-net-value-added",
  "title": "洗濯・理容・美容・浴場業の企業純付加価値額",
  "description": "洗濯・理容・美容・浴場業の企業純付加価値額を都道府県別に比較する。",
  "note": "日本標準産業分類2013年改定の中分類78（洗濯・理容・美容・浴場業）。生活関連サービス全体ではなく、その他の生活関連サービス79・娯楽80を除く。2020年1年間の経理事項。必要な数値が得られた企業等の本所所在地別、原則消費税込み。企業全体の主業により分類。2021年調査コードを2020年実績へ対応。百万円未満四捨五入。事業所所在地別の従業者数と割算しない。",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "経済センサス‐活動調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004006330",
    "config": {
      "source": {
        "name": "経済センサス‐活動調査",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004006330"
      },
      "provenance": {
        "url": "https://www.e-stat.go.jp/dbview?sid=0004006330",
        "table": "企業等に関する集計・経理第2表",
        "valueColumn": "261-2021・産業78",
        "dataYear": "2020年（2021年調査）",
        "accessedAt": "2026-09-10",
        "sourceSha256": "fe29e201e3894547d4c9a19ab307e217efd8b17918a173c1598c7ad6b7282518",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "apiParameters": {
          "statsDataId": "0004006330",
          "cdTab": "261-2021",
          "cdCat01": "78",
          "cdCat02": "0"
        },
        "pdfUrl": "https://www.stat.go.jp/data/e-census/2021/kekka/pdf/k_outline.pdf"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2020,
    "to": 2020
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
