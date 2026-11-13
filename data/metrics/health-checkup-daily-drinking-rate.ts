import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const healthCheckupDailyDrinkingRate: MetricConfig = {
  "key": "health-checkup-daily-drinking-rate",
  "title": "お酒を毎日飲む人の割合",
  "subtitle": "特定健診の受診者（40〜74歳）",
  "description": "NDB特定健診質問票の質問18「お酒（清酒、焼酎、ビール、洋酒など）を飲む頻度」に「毎日」と回答した人の割合（男女合計、年度末年齢40〜74歳）。選択肢は「毎日」「時々」「ほとんど飲まない（飲めない）」の3つ。",
  "note": "第11回NDBオープンデータの2023年度特定健診受診者。受診者の住所地（郵便番号）による都道府県別。男女・40〜74歳の7階級を合算した粗割合で年齢調整していない。都道府県判別不可を県へ配分しない。特定健診を受けた人の回答で、全県民の割合ではない。分母は同じ質問の選択肢（「毎日」「時々」「ほとんど飲まない（飲めない）」）の回答者数の合計で未回答を除外。飲む頻度の回答で、1日に飲む量は含まない。",
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
        "table": "08_特定健診_問診項目/標準的な質問票（質問項目１８）　都道府県別性年齢階級別分布.xlsx",
        "valueColumn": "質問項目シート C:I=男性7年齢、J=男性中計、K:Q=女性7年齢、R=女性中計。各県毎日/時々/ほとんど飲まない（飲めない）の3行。",
        "dataYear": "2023年度特定健診",
        "accessedAt": "2026-11-13",
        "extraction": "ZIPと指定XLSXのSHA固定。47県の男女中計の「毎日」÷（毎日＋時々＋ほとんど飲まない（飲めない））×100。年齢7階級合計と中計を照合、秘匿記号は0化せず停止。県判別不可を別記録。",
        "verification": "47県の回答数・男女中計・7年齢合計一致、分母正、0<割合<100。全国公式行なし、県判別不可を全国又は県へ混ぜない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-ndb-questionnaire.mjs --write-local"
      },
      "archiveMember": "08_特定健診_問診項目/標準的な質問票（質問項目１８）　都道府県別性年齢階級別分布.xlsx",
      "memberSha256": "5e436fc595106fcdbdf902d38265b0186104c7ffae05a37543b45c748f30d30f"
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
