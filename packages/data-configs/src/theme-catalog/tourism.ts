import type { ThemeCatalog } from "./types";

export const TOURISM_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "宿泊は従業者10人以上の施設、旅行行動は県民が対象。",
    "headlineRankingKeys": [
      "total-overnight-guests",
      "total-overnight-guests-foreign",
      "room-utilization-rate"
    ],
    "comparisonRankingKeys": [
      "total-overnight-guests",
      "total-overnight-guests-foreign",
      "room-utilization-rate",
      "travel-participation-rate-domestic-tourism",
      "travel-participation-rate-overnight",
      "travel-participation-rate-day-trip"
    ],
    "mapNotes": {
      "total-overnight-guests": "従業者10人以上の宿泊施設。外国人を含む延べ人数で、実人数ではありません。",
      "total-overnight-guests-foreign": "従業者10人以上の施設に泊まった国内非居住の外国人。宿泊者全体の内数です。",
      "room-utilization-rate": "従業者10人以上の施設の客室稼働率。すべての小規模施設を含む値ではありません。",
      "travel-participation-rate-domestic-tourism": "県民の国内観光旅行の実施割合。県を訪れた観光客の割合ではありません。",
      "travel-participation-rate-overnight": "県民の1泊2日以上の旅行行動。県内宿泊施設の利用率とは別です。",
      "travel-participation-rate-day-trip": "県民の日帰り行楽の実施割合。2021年は感染症流行期の調査です。"
    }
  },
  "key": "tourism",
  "title": "観光",
  "description": "都道府県別の宿泊者数・外国人宿泊者数・客室稼働率をランキングとチャートで比較。観光需要の地域差を47都道府県のデータで確認できます。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-overnight-guests",
      "shortLabel": "延べ宿泊者数",
      "role": "primary",
      "selection": {
        "proposedBy": "宿泊旅行統計調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "宿泊需要の規模を地図と順位表で示す。G7101の収集対象は従業者10人以上の施設。"
      }
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人延べ宿泊者数",
      "role": "primary",
      "selection": {
        "proposedBy": "宿泊旅行統計調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "宿泊需要の内訳として海外需要を比較する。全体との重複加算をしない。"
      }
    },
    {
      "rankingKey": "room-utilization-rate",
      "shortLabel": "客室稼働率",
      "role": "primary",
      "selection": {
        "proposedBy": "宿泊旅行統計調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "延べ人数の規模に加え、受け皿の利用状況を同時に示す。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-domestic-tourism",
      "shortLabel": "県民の国内観光旅行率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活基本調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "観光を受け入れる側と出かける住民の側を分け、比較表で住民の参加状況を補う。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-overseas",
      "shortLabel": "海外旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-overnight",
      "shortLabel": "県民の宿泊旅行率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活基本調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "県民の旅行行動を宿泊と日帰りで読み分ける。宿泊統計とは調査対象も時点も異なる。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-day-trip",
      "shortLabel": "県民の日帰り行楽率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活基本調査・社会人口統計体系",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
        "surveyedAt": "2026-09-09",
        "rationale": "宿泊旅行だけでは拾えない県民の日帰り行楽を比較表で示す。"
      }
    },
    {
      "rankingKey": "air-passenger-transport",
      "shortLabel": "航空旅客",
      "role": "context"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR旅客",
      "role": "context"
    },
    {
      "rankingKey": "number-of-simple-lodging-facilities",
      "shortLabel": "簡易宿所数",
      "role": "context"
    },
    {
      "rankingKey": "number-of-hotel-facilities",
      "shortLabel": "ホテル営業施設数",
      "role": "context"
    },
    {
      "rankingKey": "number-of-hotel-rooms",
      "shortLabel": "ホテル客室数",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-tourism-stay-trend",
      "componentType": "line-chart",
      "title": "延べ宿泊者数の推移（全体・外国人）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "total-overnight-guests",
            "label": "延べ宿泊者数"
          },
          {
            "metricKey": "total-overnight-guests-foreign",
            "label": "外国人延べ宿泊者数"
          }
        ],
        "labels": [
          "延べ宿泊者数",
          "外国人宿泊者数"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ],
      "sourceName": "観光庁 宿泊旅行統計調査（社会・人口統計体系収録）",
      "sourceLink": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/G",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "宿泊",
      "sortOrder": 0,
      "annotation": "外国人は全体の内数。社会・人口統計体系では従業者10人以上の宿泊施設を収集しています。"
    }
  ],
  evidenceTopics: [
    {
      "key": "domestic-and-inbound-stays",
      "lensKey": "participation",
      "title": "国内外の宿泊需要の地域集中",
      "question": "延べ宿泊者数と外国人延べ宿泊者数には、宿泊需要の地域的な集中がどう表れるか",
      "summary": "延べ宿泊者数は1人が複数泊すると泊数分を数えます。外国人延べ宿泊者数は総数の内数なので、両者を足さず、総需要と外国人需要の集中を分けて読みます。",
      "sourceKeys": [
        "jta-accommodation-survey"
      ],
      "relatedRankingKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ],
      "relatedChartKeys": [
        "theme-tourism-stay-trend"
      ]
    }
  ],
  "keywords": [
    "観光",
    "宿泊者数",
    "インバウンド",
    "客室稼働率",
    "都道府県",
    "ランキング"
  ]
};
