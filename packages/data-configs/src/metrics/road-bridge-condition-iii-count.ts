import type { MetricConfig } from '../types';

export const roadBridgeConditionIiiCount: MetricConfig = {
  "key": "road-bridge-condition-iii-count",
  "title": "道路橋の判定区分Ⅲの施設数",
  "subtitle": "全道路管理者・施設所在地別",
  "description": "2025年度末時点の道路橋について、2014〜2025年度に実施した点検の最新の健全性診断を都道府県別に集計した判定区分Ⅲの施設数。",
  "note": "2026年3月31日時点。国土交通省、高速道路会社、地方公共団体が管理する施設を、管理者名ではなく施設が所在する都道府県に帰属させています。区分Ⅲは早期措置段階、Ⅳは緊急措置段階です。区分の割合を求める場合は、同じ表の診断済総数を母数とし、管理施設数や3巡目（2024〜2025年度）の点検実施数を混ぜません。修繕等措置の実施状況は別集計であり、Ⅲ・Ⅳの件数を修繕未着手数や倒壊確率とは解釈できません。",
  "unit": "橋",
  "category": "infrastructure",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "国土交通省「道路メンテナンス年報（令和7年度）」",
    "url": "https://www.mlit.go.jp/road/sisaku/yobohozen/yobohozen_maint_r07.html",
    "config": {
      "source": {
        "name": "国土交通省「道路メンテナンス年報（令和7年度）」参考データ集",
        "url": "https://www.mlit.go.jp/road/sisaku/yobohozen/pdf/r07/z1-2.pdf"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mlit.go.jp/road/sisaku/yobohozen/yobohozen_maint_r07.html",
        "pdfUrl": "https://www.mlit.go.jp/road/sisaku/yobohozen/pdf/r07/z1-2.pdf",
        "sha256": "e09f1abeeed01a215ee7b149bc5e51e6e0ea288ff085a889534b4f76a430d9e4",
        "table": "表－全橋梁2 都道府県別過年度（2014～25年度）の点検結果（全道路管理者分）",
        "pdfPage": 1,
        "valueColumn": "Ⅲ（数値第4列）",
        "dataYear": "2025年度末（2026年3月31日時点）。2014〜2025年度の最新の点検結果。",
        "accessedAt": "2026-09-10",
        "extraction": "SHA256を固定した公式PDFをpdftotext -layoutで抽出。施設所在地の都道府県名で47行を識別し、合計・区分Ⅰ/Ⅱ/Ⅲ/Ⅳの5列を整数のまま読む。",
        "verification": "47県に欠測・重複なし。47県と全国それぞれでⅠ+Ⅱ+Ⅲ+Ⅳ=診断済総数、5列全ての47県合計が全国公表値と一致。全国725,525橋、Ⅲ50,434橋・Ⅳ612橋。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-road-maintenance.mjs --write-local"
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
    "decimalPlaces": 0
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "道路管理者による法定点検・健全性診断の行政報告を集計した資料",
  "isActive": true
};
