import type { MetricConfig } from '../types';

export const dairyCattleHoldings: MetricConfig = {
  "key": "dairy-cattle-holdings",
  "title": "乳用牛飼養戸数",
  "subtitle": "乳用牛を飼養する飼養者の戸数",
  "description": "搾乳を目的とする乳用牛を飼養する飼養者の都道府県別戸数。飼養者・牛の個体情報等から集計。",
  "note": "2025年2月1日現在。牛個体識別全国データベース等を用いた畜産統計の県別集計。飼養戸数は法人企業数ではなく、畜種間で重複する飼養者があるため合算しない。丸めにより全国値と47県合計は一致しない場合がある。",
  "unit": "戸",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "農林水産省「畜産統計」確報",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
    "config": {
      "source": {
        "name": "農林水産省「畜産統計」確報",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372628&fileKind=0"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372628&fileKind=0",
        "sha256": "72349168a1d502b14d0a69f0f7f8f10d544eac311a7b9e0dadf5c27eed34f9fa",
        "table": "1(1)ア 全国農業地域・都道府県別 飼養戸数・頭羽数",
        "valueColumn": "D列: 乳用牛飼養戸数",
        "dataYear": "2025年2月1日現在",
        "accessedAt": "2026-09-10",
        "extraction": "公式ExcelのSHA256を固定。産業・地域の列見出しと単位・調査年月を確認し、都道府県47行だけを原表の単位のまま抽出する。",
        "verification": "県名・都道府県行範囲・整数値・単位を確認。全国と47県合計の差を公式の丸め規則の上限以内で検算し、県別値は補正しない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-food-livestock.mjs --write-local"
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
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyId": "livestock-statistics",
  "isActive": true
};
