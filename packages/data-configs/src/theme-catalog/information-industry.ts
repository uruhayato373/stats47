import type { ThemeCatalog } from "./types";

export const INFORMATION_INDUSTRY_CATALOG: ThemeCatalog = {
  "key": "information-industry",
  "title": "情報通信業",
  "description": "情報通信業の民営事業所数と従業者数を、2021年経済センサスの都道府県別データで比較します。事業所の立地と働く人の分布を確認できます。",
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
    }
  ],
  "keywords": [
    "情報通信業",
    "経済センサス",
    "事業所数",
    "従業者数"
  ]
};
