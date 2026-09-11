import type { ThemeCatalog } from "./types";

export const CONSTRUCTION_INDUSTRY_CATALOG: ThemeCatalog = {
  "key": "construction-industry",
  "title": "建設業",
  "description": "建設業の完成工事高・許可業者数と、民営事業所で働く従業者数を都道府県別に比較します。工事の取引段階と統計の対象年を分けて確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "prime-contractor-completed-construction",
      "shortLabel": "元請完成工事高",
      "role": "primary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "建設業者所在地別の元請取引規模を2023年度の同じ条件で比較する。"
      }
    },
    {
      "rankingKey": "construction-industry-count",
      "shortLabel": "許可業者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "完成工事高とは別に建設業の担い手となる許可業者数を比較する。"
      }
    },
    {
      "rankingKey": "subcontractor-completed-construction",
      "shortLabel": "下請完成工事高",
      "role": "context",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "元請とは取引段階が異なり重複するため、合算せず切り替えて比較する。"
      }
    },
    {
      "rankingKey": "construction-private-employees",
      "shortLabel": "従業者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "128テーマ実現性調査・初回実装",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "2021年経済センサスの民営事業所における建設業従業者数を単年比較する。"
      }
    }
  ],
  "charts": [],
  "metricGroups": [
    {
      "key": "completed-construction",
      "title": "完成工事高",
      "rankingKeys": [
        "prime-contractor-completed-construction",
        "subcontractor-completed-construction"
      ],
      "defaultCheckedKeys": [
        "prime-contractor-completed-construction"
      ],
      "comparisonYear": "2023"
    },
    {
      "key": "contractors",
      "title": "建設業の許可業者",
      "rankingKeys": [
        "construction-industry-count"
      ],
      "defaultCheckedKeys": [
        "construction-industry-count"
      ],
      "comparisonYear": "2023"
    },
    {
      "key": "construction-employment",
      "title": "建設業の従業者",
      "rankingKeys": [
        "construction-private-employees"
      ],
      "defaultCheckedKeys": [
        "construction-private-employees"
      ],
      "comparisonYear": "2021"
    }
  ],
  "sections": [
    {
      "key": "construction-output",
      "title": "建設業の事業規模はどこで大きいか",
      "description": "完成工事高は建設業者の所在地に帰属し、工事を施工した県の金額ではありません。元請と下請には取引の重複があるため、合算して建設投資額とはみなしません。",
      "metricGroupKeys": [
        "completed-construction"
      ]
    },
    {
      "key": "construction-businesses",
      "title": "建設業の担い手はどこに多いか",
      "description": "2023年度の許可業者数を比較します。複数の業種で許可を受けていても1業者として数えます。",
      "metricGroupKeys": [
        "contractors"
      ]
    },
    {
      "key": "construction-workers",
      "title": "建設業で働く人はどこに多いか",
      "description": "2021年の民営事業所の従業者数です。2021年調査では対象名簿が拡充されているため過去年との単純な増減比較を避け、2023年度の完成工事高や許可業者数との比率は算出しません。",
      "metricGroupKeys": [
        "construction-employment"
      ]
    }
  ],
  "keywords": [
    "建設業",
    "完成工事高",
    "許可業者数",
    "従業者数"
  ]
};
