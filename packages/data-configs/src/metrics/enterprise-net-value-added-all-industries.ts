import type { MetricConfig } from "../types";

export const enterpriseNetValueAddedAllIndustries: MetricConfig = {
  "key": "enterprise-net-value-added-all-industries",
  "title": "全産業の企業純付加価値額",
  "description": "全産業の企業純付加価値額を都道府県別に比較する。",
  "note": "必要な経理数値が得られた企業等について、企業本所所在地別に集計した2020年1年間の純付加価値。外国会社・法人でない団体、公務、農林漁業の個人経営等を除く。事業所へ按分したC6201とは県別帰属が異なる。GDPとは含まれる項目が異なる。政治団体・宗教は給与総額＋租税公課の特例算式で、全産業に単一の売上−費用式を当てはめない。",
  "unit": "百万円",
  "category": "economy",
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
        "valueColumn": "261-2021 / AR / 0",
        "dataYear": "2020年（2021年調査）",
        "accessedAt": "2026-09-10",
        "sourceSha256": "fe29e201e3894547d4c9a19ab307e217efd8b17918a173c1598c7ad6b7282518",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "apiParameters": {
          "statsDataId": "0004006330",
          "cdCat01": "AR",
          "cdCat02": "0",
          "cdTab": "261-2021"
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
