import type { MetricConfig } from '../types';

export const generalPerinatalCenterCount: MetricConfig = {
  "key": "general-perinatal-center-count",
  "title": "総合周産期母子医療センター数",
  "subtitle": "2026年4月1日時点・指定施設",
  "description": "総合周産期母子医療センター数を47都道府県で比較します。都道府県の指定する総合周産期母子医療センター数。分娩取扱施設のすべてを表すものではなく、分娩を扱わないこども病院等も含みます。NICU病床数や分娩能力の量ではありません。",
  "note": "都道府県の指定する総合周産期母子医療センター数。分娩取扱施設のすべてを表すものではなく、分娩を扱わないこども病院等も含みます。NICU病床数や分娩能力の量ではありません。",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省 周産期母子医療センター一覧",
    "url": "https://www.mhlw.go.jp/content/10800000/001712292.pdf",
    "config": {
      "source": {
        "name": "厚生労働省 周産期母子医療センター一覧",
        "url": "https://www.mhlw.go.jp/content/10800000/001712292.pdf"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000186912.html",
        "url": "https://www.mhlw.go.jp/content/10800000/001712292.pdf",
        "table": "総合区分の施設を都道府県欄で集計",
        "valueColumn": "総合区分の施設を都道府県欄で集計",
        "dataYear": "2026-04-01",
        "accessedAt": "2026-09-10",
        "extraction": "固定SHAの公式原典を読み、都道府県名・県数47・重複・欠測・非負値を検査。列の母集団を保持して各県値を抽出。",
        "verification": "{\"prefectures\":47,\"facilityRows\":411,\"addressPrefectureMatches\":408,\"addressPrefectureOmitted\":3,\"sourceNationalMatches\":2} 全国計:113",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-perinatal-heritage.mjs --write-local",
        "pdfUrl": "https://www.mhlw.go.jp/content/10800000/001712292.pdf"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2026,
    "to": 2026
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
