import type { ThemeCatalog } from "./types";

export const WASTE_RECYCLING_CATALOG: ThemeCatalog = {
  "key": "waste-recycling",
  "title": "ごみ・リサイクル",
  "description": "一般廃棄物のごみ排出量、最終処分量、リサイクル率を都道府県別に比較します。量と率を分け、同じ2023年度の条件で確認できます。2024年度まで公表済みですが、このページの比較対象は2023年度です。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "garbage-total-output",
      "shortLabel": "ごみ排出量",
      "role": "primary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.env.go.jp/recycle/waste_tech/ippan/",
        "surveyedAt": "2026-09-09",
        "rationale": "一般廃棄物の排出規模を2023年度の都道府県別総量で比較する。"
      }
    },
    {
      "rankingKey": "waste-recycling-rate",
      "shortLabel": "リサイクル率",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.env.go.jp/recycle/waste_tech/ippan/",
        "surveyedAt": "2026-09-09",
        "rationale": "既存の社会生活統計指標 #H055031 を再利用し、H5614との2023年度47県の一致を検証済み。"
      }
    },
    {
      "rankingKey": "garbage-final-disposal",
      "shortLabel": "最終処分量",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.env.go.jp/recycle/waste_tech/ippan/",
        "surveyedAt": "2026-09-09",
        "rationale": "排出量とは異なる処理段階の量として、合計や補数を作らず比較する。"
      }
    }
  ],
  "charts": [],
  "metricGroups": [
    {
      "key": "waste-volume",
      "title": "ごみの排出量・最終処分量",
      "rankingKeys": [
        "garbage-total-output",
        "garbage-final-disposal"
      ],
      "defaultCheckedKeys": [
        "garbage-total-output"
      ],
      "comparisonYear": "2023"
    },
    {
      "key": "recycling-rate",
      "comparisonMap": true,
      "title": "リサイクル率",
      "rankingKeys": [
        "waste-recycling-rate"
      ],
      "defaultCheckedKeys": [
        "waste-recycling-rate"
      ],
      "comparisonYear": "2023"
    }
  ],
  "sections": [
    {
      "key": "waste-disposal",
      "title": "ごみの排出・処分量はどこで多いか",
      "description": "2023年度の一般廃棄物を比較します。2024年度まで公表済みですが、このページの対象は2023年度です。産業廃棄物は含まず、県別総量には人口規模が影響します。排出量と最終処分量は処理段階が異なるため足し合わせません。",
      "metricGroupKeys": [
        "waste-volume"
      ]
    },
    {
      "key": "resource-recovery",
      "title": "資源化の割合はどこで高いか",
      "description": "リサイクル率には集団回収量が含まれます。排出量に対する最終処分量の割合や、その補数とは一致しません。",
      "metricGroupKeys": [
        "recycling-rate"
      ]
    }
  ],
  "keywords": [
    "一般廃棄物",
    "ごみ",
    "リサイクル率",
    "最終処分量"
  ]
};
