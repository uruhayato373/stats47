import type { MetricConfig } from "../types";

export const privateEstablishmentNetValueAdded: MetricConfig = {
  "key": "private-establishment-net-value-added",
  "title": "民営事業所の純付加価値額",
  "description": "民営事業所の純付加価値額を都道府県別に比較する。",
  "note": "SSDS C6201。企業単位で把握した純付加価値を傘下事業所の事業従事者数により按分し、事業所所在地へ集計。企業の本所所在地別ではない。2021年調査の経理対象は2020年暦年であり、API時間軸の「年度」表記を機械的に採用しない。外国の会社及び法人でない団体等を除く。全国合計との差2百万円は原単位丸めによる。GDPとの定義差を保つ。",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "社会・人口統計体系（経済センサス‐活動調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0000010103",
    "config": {
      "source": {
        "name": "社会・人口統計体系（経済センサス‐活動調査）",
        "url": "https://www.e-stat.go.jp/dbview?sid=0000010103"
      },
      "provenance": {
        "url": "https://www.e-stat.go.jp/dbview?sid=0000010103",
        "table": "SSDS C 経済基盤",
        "valueColumn": "C6201 / 00001",
        "dataYear": "2020年（2021年調査）",
        "accessedAt": "2026-09-10",
        "sourceSha256": "d2bf11d7d5497a4a56d9ed62ef7e23f4d29715fd2326209514aa4e7dd4522086",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "apiParameters": {
          "statsDataId": "0000010103",
          "cdCat01": "C6201",
          "cdTab": "00001",
          "cdTime": "2020100000"
        },
        "definitionUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2020,
    "to": 2020
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
