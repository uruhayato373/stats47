import type { ThemeCatalog } from "./types";

export const RAILWAY_CATALOG: ThemeCatalog = {
  "key": "railway",
  "title": "鉄道",
  "description": "JR・民鉄の旅客利用、駅の配置と利用、貨物の規模を分けて把握する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "鉄道駅乗降客数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2023.html",
        "surveyedAt": "2026-09-08",
        "rationale": "鉄道駅乗降客数は「駅の数と利用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "JR輸送人員は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "民鉄輸送人員は「JRと民鉄の旅客利用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://nlftp.mlit.go.jp/ksj/index.html",
        "surveyedAt": "2026-09-08",
        "rationale": "鉄道駅数は「駅の数と利用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "JR貨物発送量は「貨物輸送」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "railway-passenger-trend",
      "componentType": "line-chart",
      "title": "民鉄輸送人員の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "private-railway-passenger-transport",
            "label": "民鉄輸送人員",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "private-railway-passenger-transport"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "section": "passengers"
    },
    {
      "componentKey": "railway-passenger-trend-jr",
      "componentType": "line-chart",
      "title": "JR輸送人員の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "jr-passenger-transport",
            "label": "JR輸送人員",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "jr-passenger-transport"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "annotation": "現在配信している2023年の値です。民鉄の長期系列と収録期間が異なります。",
      "section": "passengers"
    },
    {
      "componentKey": "railway-freight-trend",
      "componentType": "line-chart",
      "title": "JR貨物発送量の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "jr-freight-shipment"
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
      "section": "freight",
      "sortOrder": 30
    }
  ],
  "evidenceTopics": [
    {
      "key": "passenger-demand-by-operator",
      "lensKey": "participation",
      "title": "JR・民鉄の旅客利用規模",
      "question": "JRと民鉄の輸送人員には、都道府県ごとの利用規模の違いがどう表れるか",
      "summary": "輸送人員は延べ輸送規模で、利用者の実人数ではありません。JRと民鉄は対象事業者が異なるため、系列を分けて読みます。",
      "sourceKeys": [
        "mlit-whitepaper-2025-railway-industry"
      ],
      "relatedRankingKeys": [
        "jr-passenger-transport",
        "private-railway-passenger-transport"
      ],
      "relatedChartKeys": [
        "railway-passenger-trend"
      ]
    },
    {
      "key": "freight-modal-shift",
      "lensKey": "sustainability",
      "title": "貨物鉄道の地域別利用",
      "question": "JR貨物発送量は、低炭素物流を担う鉄道貨物の地域別利用規模をどう示すか",
      "summary": "発送量は発送地側の輸送規模です。輸送先や鉄道以外の貨物量、CO2削減量は示しません。",
      "sourceKeys": [
        "mlit-whitepaper-2025-low-carbon-transport"
      ],
      "relatedRankingKeys": [
        "jr-freight-shipment"
      ],
      "relatedChartKeys": [
        "railway-freight-trend"
      ]
    }
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
  ],
  "sections": [
    {
      "key": "passengers",
      "title": "JRと民鉄の旅客利用",
      "description": "JRと民鉄は収録期間が異なります。JRの単年値と民鉄の長期推移を分けて確認します。",
      "metricGroupKeys": [
        "passengers"
      ],
      "chartKeys": [
        "railway-passenger-trend",
        "railway-passenger-trend-jr"
      ]
    },
    {
      "key": "stations",
      "title": "駅の数と利用",
      "description": "駅の乗降客数と輸送人員では数え方が違います。乗換や往復を含むため実人数とは限りません。",
      "metricGroupKeys": [
        "stations-1",
        "stations-2"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "station-passengers"
      ]
    },
    {
      "key": "freight",
      "title": "貨物輸送",
      "description": "貨物発送量は旅客人員と別の尺度です。",
      "metricGroupKeys": [],
      "chartKeys": [
        "railway-freight-trend"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "passengers",
      "title": "JRと民鉄の旅客利用",
      "rankingKeys": [
        "jr-passenger-transport",
        "private-railway-passenger-transport"
      ],
      "defaultCheckedKeys": [
        "jr-passenger-transport",
        "private-railway-passenger-transport"
      ]
    },
    {
      "key": "stations-1",
      "title": "鉄道駅数",
      "rankingKeys": [
        "railway-station-count"
      ],
      "defaultCheckedKeys": [
        "railway-station-count"
      ]
    },
    {
      "key": "stations-2",
      "title": "鉄道駅乗降客数",
      "rankingKeys": [
        "railway-passengers"
      ],
      "defaultCheckedKeys": [
        "railway-passengers"
      ]
    }
  ]
};
