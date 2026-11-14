import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const healthCheckupFastEatingRate: MetricConfig = {
  "key": "health-checkup-fast-eating-rate",
  "title": "食べる速度が速い人の割合",
  "subtitle": "特定健診の受診者（40〜74歳）",
  "description": "NDB特定健診質問票の質問14「人と比較して食べる速度が速い」に「速い」と回答した人の割合（男女合計、年度末年齢40〜74歳）。選択肢は「速い」「ふつう」「遅い」の3つ。",
  "note": "第11回NDBオープンデータの2023年度特定健診受診者。受診者の住所地（郵便番号）による都道府県別。男女・40〜74歳の7階級を合算した粗割合で年齢調整していない。都道府県判別不可を県へ配分しない。特定健診を受けた人の回答で、全県民の割合ではない。分母は同じ質問の選択肢（「速い」「ふつう」「遅い」）の回答者数の合計で未回答を除外。食べる時間を測った値ではなく、本人が周囲と比べた回答による。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「第11回NDBオープンデータ」特定健診質問票",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00017.html",
    "config": {
      "source": {
        "name": "第11回NDBオープンデータ 特定健診質問票",
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip",
        "sha256": "95efcf4dc8500954960547e78f195216297d2255aff7d89b401c2f321b0fff69",
        "table": "08_特定健診_問診項目/標準的な質問票（質問項目１４）　都道府県別性年齢階級別分布.xlsx",
        "valueColumn": "質問項目シート C:I=男性7年齢、J=男性中計、K:Q=女性7年齢、R=女性中計。各県速い/ふつう/遅いの3行。",
        "dataYear": "2023年度特定健診",
        "accessedAt": "2026-11-13",
        "extraction": "ZIPと指定XLSXのSHA固定。47県の男女中計の「速い」÷（速い＋ふつう＋遅い）×100。年齢7階級合計と中計を照合、秘匿記号は0化せず停止。県判別不可を別記録。",
        "verification": "47県の回答数・男女中計・7年齢合計一致、分母正、0<割合<100。全国公式行なし、県判別不可を全国又は県へ混ぜない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-ndb-questionnaire.mjs --write-local"
      },
      "archiveMember": "08_特定健診_問診項目/標準的な質問票（質問項目１４）　都道府県別性年齢階級別分布.xlsx",
      "memberSha256": "ce13d8a75218bf66108dd57a934d3c1173fb74d6932561e721d13621c635f4d4"
    }
  },
  "entities": [
    "prefecture"
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "保険者からNDBへ収載された特定健診の行政記録を集計した公開データであり、独立した標本調査ではない。",
  "isActive": false
};
