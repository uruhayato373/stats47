import type { MetricConfig } from '../types';

export const foodManufacturingEstablishments: MetricConfig = {
  "key": "food-manufacturing-establishments",
  "title": "食料品製造業の事業所数",
  "subtitle": "中分類09・個人経営を除く全規模・再集計参考値",
  "description": "経理外項目の事業所数。",
  "note": "2024年経済構造実態調査・製造業事業所調査の参考値（2026年7月29日公表、令和6年経済センサス‐基礎調査反映の再集計）。個人経営・管理補助活動のみの事業所等を除き、全従業者規模を推計。日本標準産業分類中分類09（食料品製造業）に限定し、飲料・たばこ・飼料製造業、農業、卸小売、外食を含めない。 事業所・従業者は2024年6月時点。原表の共通時間軸2023は経理事項の実績年のため、本指標の年には流用しない。",
  "unit": "事業所",
  "category": "miningindustry",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "総務省・経済産業省「2024年経済構造実態調査 製造業事業所調査」再集計参考値",
    "url": "https://www.e-stat.go.jp/stat-search/files?toukei=00200555&tstat=000001231885",
    "config": {
      "source": {
        "name": "総務省・経済産業省「2024年経済構造実態調査 製造業事業所調査」再集計参考値",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040480518&fileKind=0"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.e-stat.go.jp/stat-search/files?toukei=00200555&tstat=000001231885",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040480518&fileKind=0",
        "sha256": "f7a4a74ec5a652694acb88ca69624766bdfece81d7e9afb416ce46b4413fa78f",
        "table": "第1表 産業中分類別（全事業所）、中分類09 食料品製造業",
        "valueColumn": "H列: 食料品製造業の事業所数",
        "dataYear": "2024年6月1日現在",
        "accessedAt": "2026-09-10",
        "extraction": "公式ExcelのSHA256を固定。産業・地域の列見出しと単位・調査年月を確認し、都道府県47行だけを原表の単位のまま抽出する。",
        "verification": "事業所数24,659、従業者1,110,373人、出荷額等33,179,656百万円の公式全国行と各47県合計が完全一致。47県×3列すべて欠測なし。",
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
  "surveyId": "economic-structure-survey",
  "isActive": true
};
