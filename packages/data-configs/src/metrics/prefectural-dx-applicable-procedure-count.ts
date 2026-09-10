import type { MetricConfig } from '../types';

export const prefecturalDxApplicableProcedureCount: MetricConfig = {
  "key": "prefectural-dx-applicable-procedure-count",
  "title": "都道府県行政のオンライン化対象手続数",
  "subtitle": "都道府県行政・2023年4月1日調査時点",
  "description": "都道府県政府の回答値を比較します。市区町村の値を県内合算したものではありません。",
  "note": "数え上げ対象は原表の指定32手続。空欄の市区町村専用2手続を対象外とし、市区町村データを合算しない。 率は100×分子÷分母を再計算。デジタル庁ZIPは整数%に丸めているため表示は小数1桁等に統一する。 分母は県ごと17〜26であり32固定ではない。独自の総合DXスコアとして解釈しない。 原表の済/未の個別日時は非収録。概要の調査基準日2023-04-01を表示する。 優先オンライン化の32手続リスト中、当該都道府県が「有」と回答した手続数（市区町村専用2手続は対象外）。分子はそのうち「済」と回答した数。",
  "unit": "手続",
  "category": "administrativefinancial",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "総務省「地方公共団体における行政手続等に係るオンライン利用状況調査」",
    "url": "https://www.soumu.go.jp/denshijiti/060213_02.html",
    "config": {
      "source": {
        "name": "総務省「地方公共団体における行政手続等に係るオンライン利用状況調査」",
        "url": "https://www.soumu.go.jp/denshijiti/060213_02.html"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.soumu.go.jp/denshijiti/060213_02.html",
        "url": "https://www.soumu.go.jp/main_content/000944043.zip",
        "table": "【R05個別資料】（６）オンライン利用状況調査（都道府県・市区町村 ）.xlsx / 都道府県",
        "valueColumn": "指定32手続の有/済列（市区町村専用2手続を除外）, 9:55行",
        "dataYear": "2023年4月1日調査時点",
        "accessedAt": "2026-09-10",
        "extraction": "ZIPおよびXLSXのSHAを照合し、都道府県シートのコード・県名で47県を確認。指定32手続のうち有/済を数え、割合は100×済の数÷有の数で計算。",
        "verification": "47県欠測・重複なし。利用率は分子・分母と照合。R05の公表丸め率94値とデジタル庁CSVが一致し、2022年度実績と確定。オンライン化は47県の分子・分母がCSVと一致。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-local-government-dx.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "自治体の行政手続に関する業務実績調査",
  "isActive": true
};
