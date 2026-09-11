import type { MetricConfig } from "../types";

export const roundwoodProductionVolume: MetricConfig = {
  "key": "roundwood-production-volume",
  "title": "素材生産量",
  "subtitle": "木材需給報告書・国産材",
  "description": "素材生産量を都道府県別に比較する。",
  "note": "2024年木材需給報告書の確報。素材生産量は山元の直接実測ではなく、製材・合単板・木材チップ工場への国産材入荷量を入荷元の県へ集計した量。薪炭材・しいたけ原木を含まない。表示単位未満四捨五入。原表の「-」は事実なしで0、数値0は単位未満を含む。すぎ・ひのきは合計の内数で、2樹種だけでは全量にならない。2007年までのSSDS素材生産量とは系列を接続しない。",
  "unit": "千ｍ3",
  "category": "agriculture",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "農林水産省「令和6年木材需給報告書」",
    "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431166",
    "config": {
      "source": {
        "name": "農林水産省「令和6年木材需給報告書」",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431166"
      },
      "provenance": {
        "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040431166",
        "table": "f010-06-042",
        "valueColumn": "F列 / 17〜63行",
        "dataYear": "2024",
        "accessedAt": "2026-09-10",
        "sourceSha256": "feb52d5d6099148297b944c20c3c422f922e2b7143445b2e345472a01bb6c7a5",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "sheet": "f010-06-042",
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
