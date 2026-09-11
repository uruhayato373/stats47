import type { MetricConfig } from '../types';

export const specificHealthGuidanceCompletionRate: MetricConfig = {
  "key": "specific-health-guidance-completion-rate",
  "title": "特定保健指導実施率",
  "subtitle": "40～74歳・指導対象者のうち終了した割合",
  "description": "特定保健指導実施率を47都道府県で比較します。",
  "note": "特定保健指導対象者のうち積極的支援・動機付け支援等を終了した者の割合。積極的支援対象者に対する動機付け支援相当の終了者も原表どおり含みます。受診者全体や県民全体を分母とした割合ではありません。医療保険者の2024年度報告を受診者・利用者の郵便番号で県別に整理。郵便番号で県を判別できないものを除外し、公表後の精査もあるため県合計と別公表の全国値は一致しません。男女計・40～74歳の未年齢調整値で、年齢や保険者構成の違いを含みます。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省 特定健康診査・特定保健指導に関するデータ",
    "url": "https://www.mhlw.go.jp/content/12400000/001718947.xlsx",
    "config": {
      "source": {
        "name": "厚生労働省 特定健康診査・特定保健指導に関するデータ",
        "url": "https://www.mhlw.go.jp/content/12400000/001718947.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mhlw.go.jp/stf/newpage_03092.html",
        "url": "https://www.mhlw.go.jp/content/12400000/001718947.xlsx",
        "pdfUrl": "https://www.mhlw.go.jp/content/12400000/001718882.pdf",
        "table": "特定保健指導!L7:L53（K終了者/J対象者）",
        "valueColumn": "特定保健指導!L7:L53（K終了者/J対象者）",
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
