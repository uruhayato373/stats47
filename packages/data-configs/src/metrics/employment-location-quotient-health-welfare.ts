import type { MetricConfig } from "../types";

export const employmentLocationQuotientHealthWelfare: MetricConfig = {
  "key": "employment-location-quotient-health-welfare",
  "title": "医療・福祉の従業者特化係数",
  "description": "医療・福祉の従業者特化係数を都道府県別に比較する。",
  "note": "同じ経済センサス第20表・2021年6月1日・2013年改定産業分類で、県の産業従業者構成比÷全国の同構成比。1が全国並み。民営事業所の所在地別で外国会社・法人でない団体、農林漁業個人経営等を除く。分母は上位分類のみの残差279人を含む公式全産業（公務除く）で、18大分類だけへ再正規化しない。人数・生産性・産業の優劣を表す指標ではない。",
  "unit": "倍",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "経済センサス‐活動調査から算出",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004005665",
    "config": {
      "source": {
        "name": "経済センサス‐活動調査から算出",
        "url": "https://www.e-stat.go.jp/dbview?sid=0004005665"
      },
      "provenance": {
        "url": "https://www.e-stat.go.jp/dbview?sid=0004005665",
        "table": "事業所に関する集計 第20表",
        "valueColumn": "113-2021 / cat01 P,AR / cat02 0",
        "dataYear": "2021年6月1日",
        "accessedAt": "2026-09-10",
        "sourceSha256": "b3f8f5f9b2bc304fb6ef7b70c36cd5bc276ff0628c4d51707447b622b645b5a7",
        "extraction": "公式原表のSHAと定義、47県を検証して抽出。原単位の数値を保持。",
        "verification": "全国合計、重複、欠測、表行列、母集団、対象年を決定的に検算。",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-industry-core.mjs --write-local",
        "apiParameters": {
          "statsDataId": "0004005665",
          "cdTab": "113-2021",
          "cdCat01": "P,AR",
          "cdCat02": "0"
        },
        "formula": "(prefectureIndustryEmployees / prefectureTotalEmployees) / (nationalIndustryEmployees / nationalTotalEmployees)",
        "nationalAreaCode": "00000",
        "denominatorIndustryCode": "AR",
        "industryCode": "P",
        "rounding": "未丸めの比率で計算、配信用は小数点以下8桁。表示は2桁。",
        "definitionUrl": "https://www.stat.go.jp/data/e-census/2021/kekka/pdf/k_riyou.pdf"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2021,
    "to": 2021
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "isActive": true
};
