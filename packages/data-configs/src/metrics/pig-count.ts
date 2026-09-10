import type { MetricConfig } from '../types';

export const pigCount: MetricConfig = {
  "key": "pig-count",
  "title": "豚飼養頭数",
  "subtitle": "子取り用めす・種おす・肥育豚等の合計",
  "description": "畜産統計調査の都道府県別の豚の総飼養頭数。子取り用めす豚、種おす豚、肥育豚、その他の合計。",
  "note": "2024年2月1日現在の確報。2025年は農林業センサス実施年のため豚の畜産統計調査は休止。頭数は原表の丸めを保持し、全国合計に合わせた県別補正はしない。",
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
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226135&fileKind=0"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226135&fileKind=0",
        "sha256": "4854e18a9dcbbb959f5a3d73ff29803784ba355fe1af011fd421d8ad02aed018",
        "table": "3(1)ア 全国農業地域・都道府県別 飼養戸数・頭羽数",
        "valueColumn": "G列: 豚飼養頭数",
        "dataYear": "2024年2月1日現在",
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
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyId": "livestock-statistics",
  "isActive": true
};
