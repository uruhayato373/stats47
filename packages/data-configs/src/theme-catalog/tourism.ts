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
  ],
  "charts": [
    {
      "componentKey": "theme-tourism-stay-trend",
      "componentType": "line-chart",
      "title": "宿泊者数の推移（日本人・外国人）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010107",
            "cdCat01": "G7101"
          },
          {
            "statsDataId": "0000010107",
            "cdCat01": "G7102"
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
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3706"
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
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3803"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3804"
          }
        ],
        "labels": [
          "ホテル施設数",
          "客室数"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "number-of-hotel-facilities"
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
  "keywords": [
    "観光",
    "宿泊者数",
    "インバウンド",
    "客室稼働率",
    "都道府県",
    "ランキング"
  ]
};
