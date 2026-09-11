import type { MetricConfig } from '../types';

export const amusementIndustryRevenue: MetricConfig = {
  "key": "amusement-industry-revenue",
  "title": "娯楽業の企業売上高",
  "description": "娯楽業の企業売上高を都道府県別に比較します。企業本所所在地別の2020年実績です。",
  "note": "2020年1年間の経理事項。必要な数値が得られた企業等を本所所在地別に集計し、原則消費税込み。企業全体の主業で分類しているため、事業所所在地別の従業者数と割り算して生産性を作れません。2021年調査の時間コードを実績年2020へ明示的に対応付けています。金額の単位未満四捨五入により県合計と全国値に差があります。日本標準産業分類の中分類80を対象とし、文化産業全体や地域GDPではありません。",
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
        "pdfUrl": "https://www.stat.go.jp/data/e-census/2021/kekka/pdf/k_outline.pdf",
        "table": "令和3年企業等集計・経理第2表",
        "valueColumn": "250-2021 企業売上高、企業産業中分類80",
        "dataYear": "2020年（2021年調査）",
        "accessedAt": "2026-09-10",
        "apiParameters": {
          "statsDataId": "0004006330",
          "cdTab": "250-2021",
          "cdCat01": "80",
          "cdCat02": "0"
        },
        "extraction": "APIメタデータと観測値のSHA固定。2021年調査の経理対象期間が2020年であることを公式注意書きで確認し、47県を抽出。原単位の数値を保持。",
        "verification": "47県欠測なし、県合計と全国の丸め差、純付加価値額の計算式および粗付加価値額との差を検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-cultural-industry.mjs --write-local"
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
  "isActive": true,
  "surveyId": "economic-census-activity"
};
