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
        "proposedBy": "e-Stat 政府統計の総合窓口「建設工事受注動態統計調査 建設工事施工統計調査 調査結果表（時系列、第1表～第13表）第2表 業種別－完成工事高、元請完成工事高、元請比率、下請完成工事高」（総務省統計局／国土交通省）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003126303",
        "surveyedAt": "2026-09-16",
        "rationale": "この統計表は建設工事施工統計調査の結果を業種別に完成工事高・元請完成工事高・元請比率・下請完成工事高として区分して公表しており、元請完成工事高が完成工事高全体から下請分を除いた元請段階の取引金額であることを示す。テーマが「工事の取引段階と統計の対象年を分けて確認する」ことを掲げるため、この指標は事業規模を元請段階でそろえて都道府県比較する代表的な指標となる。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の都道府県の建設業者は元請としてどれだけの工事を受注しているか。",
        "targetReaderOrDecision": "都道府県の建設業の事業規模を把握したい行政・業界関係者。"
      }
    },
    {
      "rankingKey": "construction-industry-count",
      "shortLabel": "許可業者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "建設業許可業者数調査の結果について－建設業許可業者の現況（令和5年3月末現在）－（国土交通省 不動産・建設経済局 建設業課、令和5年5月24日公表、報道発表資料）",
        "sourceUrl": "https://www.mlit.go.jp/report/press/tochi_fudousan_kensetsugyo13_hh_000001_00239.html",
        "surveyedAt": "2026-09-16",
        "rationale": "国土交通省が毎年公表する建設業許可業者数調査は、建設業の担い手（許可業者）の増減を全国・都道府県別・業種別に示す唯一の全国調査であり、令和5年度末時点で479,383業者という全国値が公表されている。テーマ「建設業の担い手はどこに多いか」を検証する上で、この許可業者数は都道府県間の担い手規模を比較する基礎データとなる。",
        "adoptionCriteria": ["representativeness", "dataQuality"],
        "readerQuestion": "自分の都道府県には建設業許可業者が何社あり、増減の傾向はどうか。",
        "targetReaderOrDecision": "地域の建設業の担い手数の推移を確認したい自治体・業界団体。"
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
        "proposedBy": "政府統計コード定義集「従業者数（民営）」（e-Stat 項目定義）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-16",
        "rationale": "この定義集は、経済センサスに基づく「従業者数（民営）」が民営事業所に限定した従業者数であり、休職者・長期欠勤者を除く点を明示している。建設業に分類される民営事業所の従業者数を都道府県別に見ることで、許可業者数（事業者の数）とは異なる角度から「建設業で働く人はどこに多いか」という章の問いに事業所単位で直接答える補完的な指標となる。",
        "adoptionCriteria": ["complementarity", "dataQuality"],
        "readerQuestion": "建設業の民営事業所で実際に働いている人はどの都道府県に多いか。",
        "targetReaderOrDecision": "地域の建設業雇用規模を事業所単位で把握したい研究者・自治体職員。"
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
