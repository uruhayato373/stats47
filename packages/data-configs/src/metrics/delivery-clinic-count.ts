import type { MetricConfig } from '../types';

export const deliveryClinicCount: MetricConfig = {
  "key": "delivery-clinic-count",
  "title": "分娩取扱一般診療所数",
  "subtitle": "2023年10月1日・分娩取扱あり",
  "description": "分娩取扱一般診療所数を47都道府県で比較します。2023年10月1日時点。9月中の分娩実績の有無にかかわらず、分娩を取り扱っている一般診療所です。医療施設所在地に帰属し、助産所を含みません。出生数との比較は地域需要に対する施設供給の目安であり、施設の実際の分娩負担や県外患者の流出入を表すものではありません。",
  "note": "2023年10月1日時点。9月中の分娩実績の有無にかかわらず、分娩を取り扱っている一般診療所です。医療施設所在地に帰属し、助産所を含みません。出生数との比較は地域需要に対する施設供給の目安であり、施設の実際の分娩負担や県外患者の流出入を表すものではありません。",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省 令和5年医療施設（静態）調査",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004024910",
    "config": {
      "source": {
        "name": "厚生労働省 令和5年医療施設（静態）調査",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004024910"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.e-stat.go.jp/dbview?sid=0004024910",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004024910",
        "table": "T111 第111表 分娩取扱（施設数） cdTab=7 cdCat01=2",
        "valueColumn": "T111 第111表 分娩取扱（施設数） cdTab=7 cdCat01=2",
        "dataYear": "2023-10-01",
        "accessedAt": "2026-09-10",
        "extraction": "固定SHAの公式原典を読み、都道府県名・県数47・重複・欠測・非負値を検査。API @cat02 の parentCode=00100/level=2 と公式県名を照合して5桁県コードへ写像。再掲83市区を除外。APIリクエストのappIdは実行環境から読み出し、記録しない。",
        "verification": "{\"prefectures\":47,\"excludedReprintedCities\":83,\"metadataNameAndCodeMatches\":47,\"sourceNationalMatches\":true,\"pdfNationalMatches\":true} 全国計:949",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-perinatal-heritage.mjs --write-local",
        "pdfUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/iryosd/23/dl/02sisetu05.pdf"
      },
      "apiQuery": {
        "statsDataId": "0004024910",
        "lang": "J",
        "cdCat01": "2",
        "limit": 1000
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
