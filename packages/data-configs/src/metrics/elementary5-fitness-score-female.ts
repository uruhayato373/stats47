import type { MetricConfig } from '../types';

export const elementary5FitnessScoreFemale: MetricConfig = {
  "key": "elementary5-fitness-score-female",
  "title": "小学5年女子の体力合計点",
  "subtitle": "公立・指定都市込み・有効標本の平均",
  "description": "小学5年女子の体力合計点を47都道府県で比較します。",
  "note": "実技8項目の得点合計の平均値。欠損や範囲外値を除いた有効標本で計算し、全国比較には有効標本数で加重した公立の平均値を用います。2025年4～7月実施の公立小学5年生（義務教育学校前期課程・特別支援学校小学部を含む調査対象）。指定都市を含む学校所在県の集計で、国立・私立と中学2年生を混ぜません。公立の児童実施率99.2％は調査全体の値で、項目ごとの有効標本率とは異なります。",
  "unit": "点",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "スポーツ庁 令和7年度全国体力・運動能力、運動習慣等調査",
    "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx",
    "config": {
      "source": {
        "name": "スポーツ庁 令和7年度全国体力・運動能力、運動習慣等調査",
        "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mext.go.jp/sports/b_menu/toukei/kodomo/zencyo/1411922_00014.html",
        "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx",
        "pdfUrl": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf",
        "table": "体力合計点!O5:O51、標本数N列",
        "valueColumn": "体力合計点!O5:O51、標本数N列",
        "dataYear": "2025年度（4～7月実施）",
        "accessedAt": "2026-09-10",
        "extraction": "公式SHA固定原典から47県を県名と順序で照合し、対象・年・分母を固定して抽出。体力平均値は指定都市を含む公立学校の列。運動割合は同母集団のPDF7頁の小数1桁を保持。",
        "verification": "{\"prefectures\":47,\"scorePdfMatchedValues\":94,\"participantPdfMatchedValues\":94,\"scoreNationalSampleSumMatches\":2,\"scoreWeightedNationalMeanMatches\":2,\"activityZeroRateXlsxMatches\":94,\"activityRoundedCategorySums\":188,\"activityNationalReweighted\":false,\"missing\":0,\"duplicates\":0}",
        "restore": "node --import tsx .claude/scripts/themes/ingest-screening-child-fitness.mjs --write-local",
        "pdfPage": 3
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
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "isActive": true
};
