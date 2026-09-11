import type { MetricConfig } from '../types';

export const prefectureDesignatedCulturalPropertyCount: MetricConfig = {
  "key": "prefecture-designated-cultural-property-count",
  "title": "都道府県指定等文化財件数",
  "subtitle": "2025年5月1日・都道府県分",
  "description": "都道府県指定等文化財件数を47都道府県で比較します。都道府県による指定・選定等を集計した件数です。市区町村指定分、国指定分、登録文化財を含む全国の文化財総数ではありません。建造物は件数で数え、棟数を加算しません。件数の多寡は保存状態や保全効果を直接表しません。",
  "note": "都道府県による指定・選定等を集計した件数です。市区町村指定分、国指定分、登録文化財を含む全国の文化財総数ではありません。建造物は件数で数え、棟数を加算しません。件数の多寡は保存状態や保全効果を直接表しません。",
  "unit": "件",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "文化庁 都道府県別指定等文化財件数（都道府県分）",
    "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html",
    "config": {
      "source": {
        "name": "文化庁 都道府県別指定等文化財件数（都道府県分）",
        "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html",
        "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html",
        "table": "全47県 合計列（建造物は件数、棟数を二重加算しない）",
        "valueColumn": "全47県 合計列（建造物は件数、棟数を二重加算しない）",
        "dataYear": "2025-05-01",
        "accessedAt": "2026-09-10",
        "extraction": "固定SHAの公式原典を読み、都道府県名・県数47・重複・欠測・非負値を検査。列の母集団を保持して各県値を抽出。",
        "verification": "{\"prefectures\":47,\"categorySubtotals\":47,\"sourceNationalMatches\":true,\"trendNationalMatches\":true} 全国計:22545",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-perinatal-heritage.mjs --write-local"
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
  "isActive": true,
  "surveyScope": "not-applicable",
  "surveyScopeReason": "施設指定・文化財指定等の行政台帳集計"
};
