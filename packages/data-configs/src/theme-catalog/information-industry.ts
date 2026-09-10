import type { ThemeCatalog } from "./types";

export const INFORMATION_INDUSTRY_CATALOG: ThemeCatalog = {
  "key": "information-industry",
  "title": "情報通信業",
  "description": "情報通信業の事業所・従業者と、県内総生産を比較します。事業所統計は2021年6月1日、県内総生産は同じ2015年基準の2011〜2021年度で、対象期間と定義を分けて読みます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "information-private-establishments",
      "shortLabel": "事業所数",
      "role": "primary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "2021年の民営事業所ベースで情報通信業の立地を比較する。"
      }
    },
    {
      "rankingKey": "information-private-employees",
      "shortLabel": "従業者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "事業所数と同じ2021年・民営事業所ベースで従業者の分布を比較する。"
      }
    },
    {
      "rankingKey": "gross-prefectural-product-information-communication-h27",
      "shortLabel": "県内総生産（名目・2015年基準）",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマの原典検証",
        "surveyedAt": "2026-09-10",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010103",
        "rationale": "同じ2015年基準で47県を確認した2011〜2021年度の付加価値を比較する。"
      }
    }
  ],
  "charts": [],
  "metricGroups": [
    {
      "key": "information-establishments",
      "title": "情報通信業の事業所",
      "rankingKeys": [
        "information-private-establishments"
      ],
      "defaultCheckedKeys": [
        "information-private-establishments"
      ],
      "comparisonYear": "2021"
    },
    {
      "key": "information-employment",
      "title": "情報通信業の従業者",
      "rankingKeys": [
        "information-private-employees"
      ],
      "defaultCheckedKeys": [
        "information-private-employees"
      ],
      "comparisonYear": "2021"
    },
    {
      "key": "information-value-added",
      "title": "情報通信業の付加価値",
      "rankingKeys": [
        "gross-prefectural-product-information-communication-h27"
      ],
      "defaultCheckedKeys": [
        "gross-prefectural-product-information-communication-h27"
      ]
    }
  ],
  "sections": [
    {
      "key": "industry-locations",
      "title": "情報通信業の事業所はどこに集まるか",
      "description": "2021年6月1日時点の民営事業所を所在地で比較します。企業本社の所在地に集約した企業数ではありません。",
      "metricGroupKeys": [
        "information-establishments"
      ]
    },
    {
      "key": "industry-workers",
      "title": "情報通信業で働く人はどこに多いか",
      "description": "2021年6月1日時点の民営事業所の従業者数です。2021年調査では対象名簿が拡充されているため、過去年との単純な増減率は示していません。",
      "metricGroupKeys": [
        "information-employment"
      ]
    },
    {
      "key": "industry-value-added",
      "title": "情報通信業はどれだけの付加価値を生んでいるか",
      "description": "2015年基準・名目県内総生産。情報通信業の生産額から中間投入を除いた付加価値。年度計であり企業売上高ではない。2021年6月1日の事業所従業者数で割算して生産性を作らない。採用窓は原典で47県を確認した2011〜2021年度。",
      "metricGroupKeys": [
        "information-value-added"
      ]
    }
  ],
  "keywords": [
    "情報通信業",
    "経済センサス",
    "事業所数",
    "従業者数"
  ]
};
