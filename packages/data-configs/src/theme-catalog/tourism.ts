import type { ThemeCatalog } from "./types";

export const TOURISM_CATALOG: ThemeCatalog = {
  "key": "tourism",
  "title": "観光",
  "description": "都道府県別の宿泊者数・外国人宿泊者数・客室稼働率をランキングとチャートで比較。観光需要の地域差を47都道府県のデータで確認できます。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-overnight-guests",
      "shortLabel": "宿泊者数",
      "role": "primary"
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人宿泊",
      "role": "secondary"
    },
    {
      "rankingKey": "room-utilization-rate",
      "shortLabel": "客室稼働率",
      "role": "secondary"
    },
    {
      "rankingKey": "travel-participation-rate-domestic-tourism",
      "shortLabel": "国内旅行率",
      "role": "secondary"
    },
    {
      "rankingKey": "travel-participation-rate-overseas",
      "shortLabel": "海外旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-overnight",
      "shortLabel": "宿泊旅行率",
      "role": "context"
    },
    {
      "rankingKey": "travel-participation-rate-day-trip",
      "shortLabel": "日帰り旅行率",
      "role": "context"
    },
    {
      "rankingKey": "air-passenger-transport",
      "shortLabel": "航空旅客",
      "role": "secondary"
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
    },
  ],
  "charts": [
    {
      "componentKey": "theme-tourism-stay-trend",
      "componentType": "line-chart",
      "title": "宿泊者数の推移（日本人・外国人）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "total-overnight-guests"
          },
          {
            "metricKey": "total-overnight-guests-foreign"
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
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "宿泊",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-tourism-transport-trend",
      "componentType": "line-chart",
      "title": "航空旅客輸送量の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "air-passenger-transport"
          }
        ],
        "labels": [
          "航空旅客"
        ],
        "seriesColors": [
          "series-7"
        ]
      },
      "relatedRankingKeys": [
        "air-passenger-transport"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "旅行・交通",
      "sortOrder": 0
    },
{
      "componentKey": "theme-tourism-hotel-supply-trend",
      "componentType": "line-chart",
      "title": "宿泊施設数と客室数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "number-of-hotel-facilities",
            "label": "ホテル営業施設数",
            "colorRole": "population"
          },
          {
            "metricKey": "number-of-hotel-rooms",
            "label": "ホテル客室数",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "number-of-hotel-facilities",
        "number-of-hotel-rooms"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 110
    }
  ],
  evidenceTopics: [
    {
      key: "domestic-and-inbound-stays",
      lensKey: "participation",
      title: "国内外の宿泊需要の地域集中",
      question:
        "延べ宿泊者数と外国人延べ宿泊者数には、宿泊需要の地域的な集中がどう表れるか",
      summary:
        "延べ宿泊者数は1人が複数泊すると泊数分を数えます。外国人延べ宿泊者数は総数の内数なので、両者を足さず、総需要と外国人需要の集中を分けて読みます。",
      sourceKeys: ["jta-accommodation-survey"],
      relatedRankingKeys: [
        "total-overnight-guests",
        "total-overnight-guests-foreign",
      ],
      relatedChartKeys: ["theme-tourism-stay-trend"],
    },
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
