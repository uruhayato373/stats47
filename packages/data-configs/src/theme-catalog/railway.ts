import type { ThemeCatalog } from "./types";

export const RAILWAY_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "駅の1日乗降客数と、年度内の鉄道旅客・貨物輸送。",
    "headlineRankingKeys": [
      "railway-passengers",
      "railway-station-count",
      "jr-passenger-transport",
      "private-railway-passenger-transport"
    ],
    "comparisonRankingKeys": [
      "railway-passengers",
      "railway-station-count",
      "jr-passenger-transport",
      "private-railway-passenger-transport",
      "jr-freight-shipment"
    ],
    "mapNotes": {
      "railway-passengers": "乗降客数が登録された駅の1日合計。同じ人の複数回利用を含みます。",
      "railway-station-count": "国土数値情報に登録された駅の数。駅までの距離や運行本数は示しません。",
      "jr-passenger-transport": "JRの年度内輸送規模。利用者の実人数や人口当たりの値ではありません。",
      "private-railway-passenger-transport": "民鉄・軌道の年度内輸送規模。JR・ロープウェイを含みません。",
      "jr-freight-shipment": "JR貨物の発送地別重量。到着貨物や他社の鉄道貨物は含みません。"
    }
  },
  "key": "railway",
  "title": "鉄道",
  "description": "都道府県別の鉄道駅乗降客数・JR/民鉄輸送人員・鉄道駅数をランキングとチャートで比較。首都圏・関西圏への利用集中と地方鉄道の縮小、旅客輸送とJR貨物の役割を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "駅の1日乗降客数",
      "role": "primary",
      "selection": {
        "proposedBy": "国土数値情報 駅別乗降客数",
        "sourceUrl": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2023.html",
        "surveyedAt": "2026-09-09",
        "rationale": "登録駅の利用集中を地図と順位表で示す。データ未登録駅を含む全駅利用者数とは区別する。"
      }
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025 鉄道関連産業",
        "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2531000.html",
        "surveyedAt": "2026-09-09",
        "rationale": "JRと民鉄の役割を分けるための概況指標。延べ輸送規模として比較する。"
      }
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025 鉄道関連産業",
        "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2531000.html",
        "surveyedAt": "2026-09-09",
        "rationale": "民鉄の旅客規模と回復過程をJRとは別系列で捉える。"
      }
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025・国土数値情報",
        "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2531000.html",
        "surveyedAt": "2026-09-09",
        "rationale": "輸送人員に駅という受け皿の量を添える。運行頻度や徒歩アクセスの代替にはしない。"
      }
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・貨物地域流動調査",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "旅客利用と別の物流機能を比較表と単独推移で補う。発送側のJR貨物のみを対象とする。"
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
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "private-railway-passenger-transport"
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
      "section": null,
      "sortOrder": 20
    }
  ],
  evidenceTopics: [
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
  ]
};
