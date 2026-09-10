import type { MetricConfig } from "../types";

export const saltIntakeMaleAgeAdjusted: MetricConfig = {
  "key": "salt-intake-male-age-adjusted",
  "title": "男性の食塩摂取量（年齢調整値）",
  "description": "国民健康・栄養調査による20歳以上の男性の1日当たり食塩摂取量。",
  "note": "2024年10〜11月の国民健康・栄養調査。年齢は11月1日現在の20歳以上で、日曜・祝日を除く任意の1日の摂取量。男女とも59歳の平均年齢へ調整した都道府県別平均値。標本調査のため95%信頼区間と表章人数を併記し、順位差を有意差と解釈しない。対象地区は通常1道府県10地区、東京都15地区、石川県8地区（能登半島地震の影響）。国民健康・栄養調査の対象世帯・世帯員に限り、全県民の実測平均ではない。NDBの健診受診者の食習慣とは別母集団。",
  "unit": "g/日",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "table": "第68表 食塩摂取量の平均値（20歳以上、性・都道府県別、年齢調整値）",
        "pdfPage": 4,
        "valueColumn": "男性の平均値・人数・95%信頼区間",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-09-10",
        "extraction": "PDFのSHAを固定し、47県＋全国の男女別人数・平均・CI上下限を抽出。年齢調整59歳を確認。CI/nはapp/themes/health-checkups/nutrition.jsonへ保持。",
        "verification": "47県欠測なし、CI下限<=平均<=上限、人数県合計=全国男性7225・女性8491。調整平均は県単純平均から作らない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
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
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "isActive": true
};
