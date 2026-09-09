import type { ThemeCatalog } from "./types";

export const PORTS_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "都道府県別の港湾取扱量。対象外・未収録の地域は0として扱いません。",
    "headlineRankingKeys": [
      "port-cargo-total",
      "port-container-count",
      "port-inbound-ships",
      "passenger-ship-transport"
    ],
    "comparisonRankingKeys": [
      "port-cargo-total",
      "port-container-count",
      "port-inbound-ships",
      "passenger-ship-transport",
      "port-cargo-export",
      "port-cargo-import"
    ],
    "mapNotes": {
      "port-cargo-total": "輸出入と国内移出入の合計。値がない県は0ではありません。",
      "port-container-count": "20フィート換算の個数（TEU）。空コンテナも含み、貨物の重量とは異なります。",
      "port-inbound-ships": "延べ入港隻数。対象のない内陸県を0隻として比べません。",
      "passenger-ship-transport": "国内一般旅客が対象。フェリーの車両乗車人員は含みません。",
      "port-cargo-export": "国外へ輸出した貨物の取扱量。国内移出を含みません。",
      "port-cargo-import": "国外から輸入した貨物の取扱量。国内移入を含みません。"
    }
  },
  "key": "ports",
  "title": "港湾",
  "description": "都道府県別の港湾取扱貨物量・コンテナ個数・入港船舶・港湾旅客数をランキングとチャートで比較。貿易立国日本の玄関口がどの地域に集中するのか、輸出入貨物の偏在やフェリー・旅客船の地域交通機能を47都道府県のデータで可視化します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "port-cargo-total",
      "shortLabel": "海上出入貨物量",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通省 港湾関係統計データ",
        "sourceUrl": "https://www.mlit.go.jp/statistics/details/port_list.html",
        "surveyedAt": "2026-09-09",
        "rationale": "港湾物流の規模を概況・地図・比較表の基準とする。県内経済規模や人口当たりの量には読み替えない。"
      }
    },
    {
      "rankingKey": "port-cargo-export",
      "shortLabel": "輸出貨物量",
      "role": "secondary",
      "selection": {
        "proposedBy": "国土交通省 港湾関係統計データ",
        "sourceUrl": "https://www.mlit.go.jp/statistics/details/port_list.html",
        "surveyedAt": "2026-09-09",
        "rationale": "輸入と輸出を別線で示し、外貿貨物の方向を比較する。国内移出入は別。"
      }
    },
    {
      "rankingKey": "port-cargo-import",
      "shortLabel": "輸入貨物量",
      "role": "secondary",
      "selection": {
        "proposedBy": "国土交通省 港湾関係統計データ",
        "sourceUrl": "https://www.mlit.go.jp/statistics/details/port_list.html",
        "surveyedAt": "2026-09-09",
        "rationale": "輸出と輸入の規模差を比較表と同一単位の推移で読む。"
      }
    },
    {
      "rankingKey": "port-container-count",
      "shortLabel": "コンテナ個数",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通省 港湾統計の利用上の参考情報",
        "sourceUrl": "https://www.mlit.go.jp/k-toukei/kouwan_03.html",
        "surveyedAt": "2026-09-09",
        "rationale": "貨物重量とは別にコンテナ物流の規模を示す。空コンテナを含むTEU換算。"
      }
    },
    {
      "rankingKey": "maritime-import-export-cargo",
      "shortLabel": "海上出入貨物(統計体系)",
      "role": "context"
    },
    {
      "rankingKey": "port-inbound-ships",
      "shortLabel": "入港船舶隻数",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通省 港湾関係統計データ",
        "sourceUrl": "https://www.mlit.go.jp/statistics/details/port_list.html",
        "surveyedAt": "2026-09-09",
        "rationale": "貨物の量に入港活動の頻度を添える。延べ隻数であり船の実隻数ではない。"
      }
    },
    {
      "rankingKey": "port-ships-tonnage",
      "shortLabel": "入港船舶総トン数",
      "role": "context"
    },
    {
      "rankingKey": "passenger-ship-transport",
      "shortLabel": "国内旅客船の輸送人員",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・旅客地域流動調査",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "港湾の物流以外の国内旅客機能を示す。港湾調査の船舶乗降人員と混同しない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "ports-cargo-trend",
      "componentType": "line-chart",
      "title": "輸出入 海上貨物量の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "port-cargo-export",
            "label": "輸出貨物量",
            "colorRole": "population"
          },
          {
            "metricKey": "port-cargo-import",
            "label": "輸入貨物量",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "port-cargo-export",
        "port-cargo-import"
      ],
      "sourceName": "国土交通省 港湾統計",
      "sourceLink": "https://www.mlit.go.jp/statistics/details/port_list.html",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    }
  ],
  evidenceTopics: [
    {
      "key": "cargo-throughput-concentration",
      "lensKey": "participation",
      "title": "港湾貨物とコンテナ利用の集中",
      "question": "海上出入貨物量とコンテナ取扱個数には、港湾利用の地域的な集中がどう表れるか",
      "summary": "貨物量はトン、コンテナ個数はTEUで単位と対象が異なります。同じ量として足し合わせず、地域別の利用規模を別々に読みます。",
      "sourceKeys": [
        "mlit-port-statistics"
      ],
      "relatedRankingKeys": [
        "port-cargo-total",
        "port-container-count"
      ],
      "relatedChartKeys": [
        "ports-cargo-trend"
      ],
      "relatedThemeKeys": [
        "roads"
      ]
    },
    {
      "key": "passenger-port-use",
      "lensKey": "participation",
      "title": "船舶旅客の地域別利用",
      "question": "港湾旅客数は、港を利用する旅客移動の地域差をどう示すか",
      "summary": "港湾旅客数は船舶乗降人員の集計です。利用者の実人数や移動距離、航路数は示しません。",
      "sourceKeys": [
        "mlit-port-statistics"
      ],
      "relatedRankingKeys": [
        "passenger-ship-transport"
      ],
      "relatedThemeKeys": [
        "railway"
      ]
    }
  ],
  "keywords": [
    "港湾",
    "港",
    "貿易",
    "コンテナ",
    "貨物",
    "輸出入",
    "フェリー",
    "海運"
  ],
  "relatedArticleTagKeys": [
    "港湾",
    "貿易",
    "物流",
    "海運"
  ]
};
