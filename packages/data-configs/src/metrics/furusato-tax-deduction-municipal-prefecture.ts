import type { MetricConfig } from '../types';

export const furusatoTaxDeductionMunicipalPrefecture: MetricConfig = {
  "key": "furusato-tax-deduction-municipal-prefecture",
  "title": "ふるさと納税の市町村民税控除額",
  "subtitle": "県内課税分・推計値含む",
  "description": "県内全市区町村の課税におけるふるさと納税に係る市町村民税控除額を都道府県別に集計。寄附の受入先の集計ではない。",
  "note": "2026年度課税（2025年1月〜12月の寄附）で、2026年6月1日時点の公式集計。推計値を含み、原典の小数を保持します。都道府県自身への寄附受入額とは対象と期間が異なります。市町村民税分と道府県民税分を一律按分せず、別系列で掲載します。受入額との差を損益としません。",
  "unit": "円",
  "category": "administrativefinancial",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "総務省 ふるさと納税に関する現況調査（令和8年度実施）",
    "url": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/",
    "config": {
      "source": {
        "name": "総務省 ふるさと納税に関する現況調査（令和8年度実施）",
        "url": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/archive/",
        "url": "https://www.soumu.go.jp/main_content/001085012.xlsx",
        "table": "集計表",
        "valueColumn": "BE列、47県集計行",
        "dataYear": "2026年度課税（2025暦年寄附分）",
        "accessedAt": "2026-09-10",
        "extraction": "公式県集計行を抽出し、内訳1741市区町村の独立合算と全国計に照合。原表の数値を倍精度浮動小数として保存し、端数を整数円へ丸めない。",
        "verification": "1741市区町村→47県→全国の合計を浮動小数精度内で照合。概要PDF10ページの47県値と百万円丸めで一致。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-furusato-donations.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2026,
    "to": 2026
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "地方税の控除に関する行政実績集計",
  "isActive": true
};
