import type { MetricConfig } from '../types';

export const buriedCulturalPropertySpecialistCount: MetricConfig = {
  "key": "buried-cultural-property-specialist-count",
  "title": "埋蔵文化財専門職員数",
  "subtitle": "2025年5月1日・県と市町村等の合計",
  "description": "埋蔵文化財専門職員数を47都道府県で比較します。地方公共団体、公益法人等調査組織、博物館・資料館・研究所等で埋蔵文化財に関する専門業務に従事する職員。県関係と県内市町村関係の本庁・調査組織・関係機関を合算し、正規・有期を含みます。文化財全分野の担当者数ではありません。整理作業専従者・調査補助員・作業員は除外されます。",
  "note": "地方公共団体、公益法人等調査組織、博物館・資料館・研究所等で埋蔵文化財に関する専門業務に従事する職員。県関係と県内市町村関係の本庁・調査組織・関係機関を合算し、正規・有期を含みます。文化財全分野の担当者数ではありません。整理作業専従者・調査補助員・作業員は除外されます。",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "文化庁 埋蔵文化財関係統計資料 令和7年度",
    "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf",
    "config": {
      "source": {
        "name": "文化庁 埋蔵文化財関係統計資料 令和7年度",
        "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/maizo.html",
        "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf",
        "table": "印刷7頁/PDF9頁 表3 埋蔵文化財専門職員の体制 最右合計",
        "valueColumn": "印刷7頁/PDF9頁 表3 埋蔵文化財専門職員の体制 最右合計",
        "dataYear": "2025-05-01",
        "accessedAt": "2026-09-10",
        "extraction": "固定SHAの公式原典を読み、都道府県名・県数47・重複・欠測・非負値を検査。列の母集団を保持して各県値を抽出。",
        "verification": "{\"prefectures\":47,\"staffCompositionIdentities\":329,\"sourceNationalMatches\":true} 全国計:5571",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-perinatal-heritage.mjs --write-local",
        "pdfUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf",
        "pdfPage": 9
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
