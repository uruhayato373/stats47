import type { MetricConfig } from '../types';

export const beefCattleCount: MetricConfig = {
  "key": "beef-cattle-count",
  "title": "肉用牛飼養頭数",
  "subtitle": "肉用目的の牛の合計・肉用種と乳用種を含む",
  "description": "肉用を目的として飼養する牛の合計。種おす・子取り用めすを含み、利用目的で区分する。肥育目的の乳用種も含むが、乳用牛の廃牛の短期肥育は除く。",
  "note": "2025年2月1日現在。牛個体識別全国データベース等を用いた畜産統計の県別集計。飼養戸数は法人企業数ではなく、畜種間で重複する飼養者があるため合算しない。丸めにより全国値と47県合計は一致しない場合がある。",
  "unit": "頭",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "農林水産省「畜産統計」確報",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
    "config": {
      "source": {
        "name": "農林水産省「畜産統計」確報",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372636&fileKind=0"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372636&fileKind=0",
        "sha256": "52fd71aadd332269dca66d4a888c3e9b54ca4893f186752cab4c5a592f6d42c6",
        "table": "2(1)ア 全国農業地域・都道府県別 飼養戸数・頭羽数",
        "valueColumn": "G列: 肉用牛飼養頭数",
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
