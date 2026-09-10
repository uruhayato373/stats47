import type { MetricConfig } from "../types";

export const sawmillCount: MetricConfig = {
  "key": "sawmill-count",
  "title": "製材工場数",
  "description": "製材工場数を都道府県別に比較する。",
  "note": "2024年確報。製材用動力7.5kW以上の製材工場。工場数は12月31日現在に操業又は3か月未満休業中の工場、出荷量は1年間に出荷のあった工場の合計。工場所在地別。出荷量は国産材・輸入材の両方を含み、素材生産量の県帰属と異なる。表示単位未満四捨五入。数値0は単位未満を含む。",
  "unit": "工場",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "農林水産省「令和6年木材需給報告書」",
    "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431170",
    "config": {
      "source": {
        "name": "農林水産省「令和6年木材需給報告書」",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431170"
      },
      "provenance": {
        "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431170",
        "table": "f010-06-046",
        "valueColumn": "F列 / 17〜63行",
        "dataYear": "2024",
        "accessedAt": "2026-09-10",
        "sourceSha256": "6c9e36f0765eea479d1c06ec735a813dd8de1c215ba7900505e89348513ac219",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "sheet": "f010-06-046",
        "column": 6,
        "prefectureRows": [
          17,
          63
        ],
        "nationalRow": 15,
        "releaseStatus": "final",
        "definitionUrl": "https://www.maff.go.jp/j/tokei/kouhyou/mokuzai/gaiyou/"
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
  "isActive": true
};
