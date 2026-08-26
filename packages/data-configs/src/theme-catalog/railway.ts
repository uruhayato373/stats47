import type { ThemeCatalog } from "./types";

export const RAILWAY_CATALOG: ThemeCatalog = {
  "key": "railway",
  "title": "鉄道",
  "description": "都道府県別の鉄道駅乗降客数・JR/民鉄輸送人員・鉄道駅数をランキングとチャートで比較。首都圏・関西圏への利用集中と地方鉄道の縮小、旅客輸送とJR貨物の役割を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "鉄道駅乗降客数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary"
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "secondary"
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "railway-passenger-trend",
      "componentType": "line-chart",
      "title": "鉄道輸送人員の推移（JR・民鉄）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3704"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3705"
          }
        ],
        "labels": [
          "JR",
          "民鉄"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "jr-passenger-transport"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
    {
      "componentKey": "railway-freight-trend",
      "componentType": "line-chart",
      "title": "JR貨物発送量の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3702"
          }
        ],
        "labels": [
          "JR貨物発送量"
        ],
        "seriesColors": [
          "special"
        ]
      },
      "relatedRankingKeys": [
        "jr-freight-shipment"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
    }
  ],
  evidenceTopics: [
    {
      key: "passenger-demand-by-operator",
      lensKey: "participation",
      title: "JR・民鉄の旅客利用規模",
      question:
        "JRと民鉄の輸送人員には、都道府県ごとの利用規模の違いがどう表れるか",
      summary:
        "輸送人員は延べ輸送規模で、利用者の実人数ではありません。JRと民鉄は対象事業者が異なるため、系列を分けて読みます。",
      sourceKeys: ["mlit-whitepaper-2025-railway-industry"],
      relatedRankingKeys: [
        "jr-passenger-transport",
        "private-railway-passenger-transport",
      ],
      relatedChartKeys: ["railway-passenger-trend"],
    },
    {
      key: "freight-modal-shift",
      lensKey: "sustainability",
      title: "貨物鉄道の地域別利用",
      question:
        "JR貨物発送量は、低炭素物流を担う鉄道貨物の地域別利用規模をどう示すか",
      summary:
        "発送量は発送地側の輸送規模です。輸送先や鉄道以外の貨物量、CO2削減量は示しません。",
      sourceKeys: ["mlit-whitepaper-2025-low-carbon-transport"],
      relatedRankingKeys: ["jr-freight-shipment"],
      relatedChartKeys: ["railway-freight-trend"],
    },
  ],
  "keywords": [
    "鉄道",
    "JR",
    "私鉄",
    "民鉄",
    "駅",
    "乗降客",
    "輸送人員",
    "鉄道貨物"
  ],
  "relatedArticleTagKeys": [
    "鉄道",
    "交通",
    "公共交通"
  ]
};
