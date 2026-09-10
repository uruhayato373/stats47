import type { MetricConfig } from '../types';

export const prefecturalRecruitmentOnlineApplicationRate: MetricConfig = {
  "key": "prefectural-recruitment-online-application-rate",
  "title": "職員採用試験申込のオンライン申請率",
  "subtitle": "都道府県行政",
  "description": "都道府県政府の回答値を比較します。市区町村の値を県内合算したものではありません。",
  "note": "2022年度（令和4年度）の利用実績。2023年調査、2024年公開であり、2024年度値ではない。 オンライン利用率は原表の公表率。元の申請総件数・オンライン件数を併記し、他手続との単純平均は作らない。 当該都道府県政府が回答した同一手続の申請総件数",
  "unit": "%",
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
        "valueColumn": "DP, 9:55行",
        "dataYear": "2022年度実績",
        "accessedAt": "2026-09-10",
        "extraction": "ZIPおよびXLSXのSHAを照合し、都道府県シートのコード・県名で47県を確認。原表の総数・オンライン件数・率を抽出。R05の小数比率のみ100倍して%に変換。",
        "verification": "47県欠測・重複なし。利用率は分子・分母と照合。R05の公表丸め率94値とデジタル庁CSVが一致し、2022年度実績と確定。オンライン化は47県の分子・分母がCSVと一致。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-local-government-dx.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2022,
    "to": 2022
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "自治体の行政手続に関する業務実績調査",
  "isActive": true
};
