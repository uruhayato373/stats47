import type { MetricConfig } from '../types';

export const layerHenCount: MetricConfig = {
  "key": "layer-hen-count",
  "title": "採卵鶏の成鶏めす飼養羽数",
  "subtitle": "6か月以上の成鶏めす・種鶏とひなを除く",
  "description": "6か月以上の採卵鶏成鶏めすの都道府県別飼養羽数。種鶏と6か月未満のひなを除く。",
  "note": "2024年2月1日現在の確報。成鶏めす1,000羽以上の飼養者（ひなのみ・種鶏のみで各1,000羽以上を含む）が調査対象。原表単位は千羽。2025年は農林業センサス実施年のため調査休止。鶏全体・採卵鶏全年齢・卵生産量とは異なる。",
  "unit": "千羽",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "農林水産省「畜産統計」確報",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
    "config": {
      "source": {
        "name": "農林水産省「畜産統計」確報",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226152&fileKind=0"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226152&fileKind=0",
        "sha256": "f24b2a564c498108c0c6e8beae5f4f6f18bb5e2b6c84591cf25a50fb506163a5",
        "table": "4(1) 全国農業地域・都道府県別 飼養戸数・頭羽数",
        "valueColumn": "K列: 採卵鶏の成鶏めす飼養羽数",
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
