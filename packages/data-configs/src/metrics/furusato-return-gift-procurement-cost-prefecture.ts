import type { MetricConfig } from '../types';

export const furusatoReturnGiftProcurementCostPrefecture: MetricConfig = {
  "key": "furusato-return-gift-procurement-cost-prefecture",
  "title": "ふるさと納税返礼品調達費",
  "subtitle": "都道府県自身・決算見込",
  "description": "ふるさと納税返礼品調達費の都道府県自身の実績。県内市区町村分は含みません。",
  "note": "2025年度（2025年4月1日〜2026年3月31日）の決算見込。東京都は当年度の指定申出がなく特例控除対象外ですが原表の受入実績に含みます。代理受入とポータル費用は内数で重複加算しません。受入額と住民税控除額の差は最終損益ではありません。",
  "unit": "円",
  "category": "administrativefinancial",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "総務省「ふるさと納税に関する現況調査」令和8年度",
    "url": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/",
    "config": {
      "source": {
        "name": "総務省「ふるさと納税に関する現況調査」令和8年度",
        "url": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/",
        "url": "https://www.soumu.go.jp/main_content/001084989.xlsx",
        "table": "各自治体のふるさと納税受入額及び受入件数等（令和7年度） Sheet1",
        "valueColumn": "L列、A列の団体コード先頭5桁がNN000の47団体",
        "dataYear": "2025年度（決算見込）",
        "accessedAt": "2026-09-10",
        "extraction": "原典SHA256を固定し、Sheet1の14〜1801行から都道府県自身の47団体をコードと県名で抽出。市町村は除外。",
        "verification": "47県欠測・重複なし。受入額・件数は別の公式履歴表と全県一致。募集費はL:Qの内訳合計と47県一致。全国1788団体の受入額・件数は履歴表の全国合計と一致。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-furusato-donations.mjs --write-local"
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
  "surveyScopeReason": "自治体の寄附受入業務に関する行政実績調査",
  "isActive": true
};
