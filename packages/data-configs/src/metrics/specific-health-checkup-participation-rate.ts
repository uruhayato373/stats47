import type { MetricConfig } from '../types';

export const specificHealthCheckupParticipationRate: MetricConfig = {
  "key": "specific-health-checkup-participation-rate",
  "title": "特定健診受診率",
  "subtitle": "40～74歳・県別推計対象者が分母",
  "description": "特定健診受診率を47都道府県で比較します。",
  "note": "特定健診受診者数を都道府県人口を基にした対象者数の推計値で割った割合。対象者は原則年度当初加入の40～74歳で、異動者や妊産婦等の除外条件があります。医療保険者の2024年度報告を受診者・利用者の郵便番号で県別に整理。郵便番号で県を判別できないものを除外し、公表後の精査もあるため県合計と別公表の全国値は一致しません。男女計・40～74歳の未年齢調整値で、年齢や保険者構成の違いを含みます。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省 特定健康診査・特定保健指導に関するデータ",
    "url": "https://www.mhlw.go.jp/content/12400000/001718946.xlsx",
    "config": {
      "source": {
        "name": "厚生労働省 特定健康診査・特定保健指導に関するデータ",
        "url": "https://www.mhlw.go.jp/content/12400000/001718946.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mhlw.go.jp/stf/newpage_03092.html",
        "url": "https://www.mhlw.go.jp/content/12400000/001718946.xlsx",
        "pdfUrl": "https://www.mhlw.go.jp/content/12400000/001718882.pdf",
        "table": "特定健康診査!E5:E51（D受診者/C推計対象者）",
        "valueColumn": "特定健康診査!E5:E51（D受診者/C推計対象者）",
        "dataYear": "2024年度",
        "accessedAt": "2026-09-10",
        "extraction": "公式SHA固定原典から47県を県名と順序で照合し、対象・年・分母を固定して抽出。XLSXの比率セルを分子/分母で検算して100倍し、単位％として保存。",
        "verification": "{\"prefectures\":47,\"sourceRatios\":141,\"sourceCountTotals\":7,\"recipientCrossTableMatches\":47,\"missing\":0,\"duplicates\":0,\"nationalSamePopulation\":false}",
        "restore": "node --import tsx .claude/scripts/themes/ingest-screening-child-fitness.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "isActive": true,
  "surveyScope": "not-applicable",
  "surveyScopeReason": "医療保険者から国への特定健診・特定保健指導の実施報告に基づく行政集計。国民健康・栄養調査等とは別。"
};
