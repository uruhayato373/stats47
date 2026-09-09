import type { ThemeCatalog } from "./types";

export const FISHERY_MARINE_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "生産量は海面・内水面、産出額と就業者は海面漁業が対象。",
    "headlineRankingKeys": [
      "fish-catch",
      "aquaculture-harvest",
      "marine-fishery-aquaculture-output-value",
      "fishery-workers"
    ],
    "comparisonRankingKeys": [
      "fish-catch",
      "aquaculture-harvest",
      "marine-fishery-aquaculture-output-value",
      "fishery-workers",
      "marine-fishery-catch",
      "inland-fishery-catch",
      "marine-aquaculture-harvest",
      "inland-aquaculture-harvest"
    ],
    "mapNotes": {
      "fish-catch": "海面・内水面の漁獲合計。養殖を含まず、内水面は調査対象範囲に注意。",
      "aquaculture-harvest": "海面・内水面の養殖収獲量。天然の漁獲量とは分けて集計します。",
      "marine-fishery-aquaculture-output-value": "海面漁業・養殖業の産出額。沿岸39都道府県が対象で内陸県は0ではありません。",
      "fishery-workers": "15歳以上で海上作業に年30日以上従事した人。内水面の全就業者ではありません。",
      "marine-fishery-catch": "海面漁業の漁獲量。海面養殖の収獲量は含みません。",
      "inland-fishery-catch": "調査対象の河川・湖沼の漁獲量。対象範囲が時期により異なります。",
      "marine-aquaculture-harvest": "海水で育成した水産物の収獲量。値がない県を0として扱いません。",
      "inland-aquaculture-harvest": "淡水で育成した食用水産物の収獲量。種苗の販売量は含みません。"
    }
  },
  "key": "fishery-marine",
  "title": "漁業（水産業）",
  "description": "都道府県別の漁獲量・養殖収獲量・漁業就業者数・漁業産出額・漁港数をランキングとチャートで比較。北海道が全国漁獲量の約2割を占める一方、半世紀で就業者は7割減・漁獲量はほぼ半減。「捕る漁業」から「育てる漁業」へのシフトを47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fish-catch",
      "shortLabel": "漁獲量",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年度水産白書・漁業養殖業生産統計",
        "sourceUrl": "https://www.jfa.maff.go.jp/j/kikaku/wpaper/R7/260605_1.html",
        "surveyedAt": "2026-09-09",
        "rationale": "供給構造を天然漁獲と養殖に分け、産出額や担い手の量と合わせて読む。"
      }
    },
    {
      "rankingKey": "marine-fishery-catch",
      "shortLabel": "海面漁獲量",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・漁業養殖業生産統計",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "海面と内水面の生産構造を比較表で分ける。総漁獲量との重複加算を避ける。"
      }
    },
    {
      "rankingKey": "inland-fishery-catch",
      "shortLabel": "内水面漁獲量",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・漁業養殖業生産統計",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "内陸県も含めた漁獲の地域差を補う。調査対象河川・湖沼の変化を注記する。"
      }
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "指定漁港総数",
      "role": "context"
    },
    {
      "rankingKey": "aquaculture-harvest",
      "shortLabel": "養殖収獲量",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年度水産白書 養殖業特集",
        "sourceUrl": "https://www.jfa.maff.go.jp/j/kikaku/wpaper/R7/260605_1.html",
        "surveyedAt": "2026-09-09",
        "rationale": "白書が扱う養殖の供給基盤を概況KPIで確認する。魚種ごとの古い全国構成図より地域比較を優先。"
      }
    },
    {
      "rankingKey": "marine-aquaculture-harvest",
      "shortLabel": "海面養殖",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・漁業養殖業生産統計",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "海水を使う養殖の規模を内水面と区別し、同単位で比較する。"
      }
    },
    {
      "rankingKey": "inland-aquaculture-harvest",
      "shortLabel": "内水面養殖",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・漁業養殖業生産統計",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "内陸県の養殖の供給量を把握する。海面産出額の対象外を漁業活動ゼロと誤読させない。"
      }
    },
    {
      "rankingKey": "marine-fishery-aquaculture-output-value",
      "shortLabel": "海面漁業・養殖産出額",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・漁業産出額",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
        "surveyedAt": "2026-09-09",
        "rationale": "重量だけで把握できない経済規模を補う。2017年以降の現行系列を使い、旧系列を接続しない。"
      }
    },
    {
      "rankingKey": "marine-fishery-output-value",
      "shortLabel": "海面漁業産出額",
      "role": "context"
    },
    {
      "rankingKey": "fishery-output-value",
      "shortLabel": "産出額（旧）",
      "role": "context"
    },
    {
      "rankingKey": "fishery-workers",
      "shortLabel": "海面漁業の就業者数",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年度水産白書・漁業センサス",
        "sourceUrl": "https://www.jfa.maff.go.jp/j/kikaku/wpaper/R7/260605_1.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生産を支える担い手の規模を独立したKPIで示す。海上作業の従事条件を維持。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-scallop",
      "shortLabel": "ホタテガイ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-japanese-squid",
      "shortLabel": "スルメイカ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-tuna",
      "shortLabel": "マグロ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-bonito",
      "shortLabel": "カツオ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-mackerel",
      "shortLabel": "サバ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pacific-saury",
      "shortLabel": "サンマ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-yellowtail",
      "shortLabel": "ブリ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sardine",
      "shortLabel": "イワシ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pollock",
      "shortLabel": "スケトウダラ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-kelp",
      "shortLabel": "コンブ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-snow-crab",
      "shortLabel": "ズワイガニ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sea-bream",
      "shortLabel": "タイ類",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-fishery-catch-trend",
      "componentType": "line-chart",
      "title": "漁獲量の推移（合計・海面）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fish-catch"
          },
          {
            "metricKey": "marine-fishery-catch"
          }
        ],
        "labels": [
          "漁獲量（合計）",
          "海面漁獲量"
        ],
        "seriesColors": [
          "population",
          "series-6"
        ]
      },
      "relatedRankingKeys": [
        "fish-catch",
        "marine-fishery-catch"
      ],
      "sourceName": "農林水産省 漁業・養殖業生産統計",
      "sourceLink": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "漁獲",
      "sortOrder": 0,
      "annotation": "海面は合計の内数。内水面の調査対象範囲は時期により異なります。"
    },
    {
      "componentKey": "theme-fishery-aquaculture-mix",
      "componentType": "line-chart",
      "title": "養殖収獲量の推移（海面・内水面）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "marine-aquaculture-harvest",
            "label": "海面養殖",
            "colorRole": "population"
          },
          {
            "metricKey": "inland-aquaculture-harvest",
            "label": "内水面養殖",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "marine-aquaculture-harvest",
        "inland-aquaculture-harvest"
      ],
      "sourceName": "農林水産省 漁業・養殖業生産統計",
      "sourceLink": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "養殖",
      "sortOrder": 10
    }
  ],
  "evidenceTopics": [
    {
      "key": "aquaculture-supply-shift",
      "lensKey": "sustainability",
      "title": "漁獲と養殖の供給構造",
      "question": "漁獲量と養殖収獲量の推移には、どのような地域差があるか。",
      "summary": "漁獲と養殖を別系列で追うと、水産物の生産構造の違いを確認できます。資源量の健全性や需要、採算性を直接示す指標ではありません。",
      "sourceKeys": [
        "jfa-fisheries-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fish-catch",
        "aquaculture-harvest"
      ],
      "relatedChartKeys": [
        "theme-fishery-catch-trend",
        "theme-fishery-aquaculture-mix"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "fishery-workforce-continuity",
      "lensKey": "service-capacity",
      "title": "漁業の担い手と地域の継続性",
      "question": "漁業就業者数の長期変化は、地域の担い手基盤をどう映しているか。",
      "summary": "漁業就業者数の長期推移から担い手規模の変化を確認できます。新規就業者数、年齢構成、兼業状況はこの系列に含まれません。",
      "sourceKeys": [
        "jfa-fisheries-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fishery-workers"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "aging-society"
      ]
    },
    {
      "key": "fish-consumption-east-west",
      "lensKey": "composition",
      "title": "生鮮魚介の好みは産地ではなく消費地で分かれる",
      "question": "家庭で買う生鮮魚介の支出額を品目別に並べると、県庁所在市はどのような地域のまとまりに分かれるか",
      "summary": "漁獲量が多い産地と、家庭でよく買う消費地は一致しない。太平洋側・東日本はまぐろ・さけ・さんま、日本海側・西日本はぶり・さば・かれい・たい・あじの支出が相対的に大きい。値は県庁所在市の二人以上世帯で、外食は含まない。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024"
      ],
      "relatedRankingKeys": [
        "tuna-consumption-expenditure",
        "yellowtail-consumption-expenditure",
        "saury-consumption-expenditure",
        "bonito-consumption-expenditure",
        "oyster-consumption-expenditure",
        "mackerel-consumption-expenditure",
        "fishery-species-catch-tuna",
        "fishery-species-catch-yellowtail"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "tourism",
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "漁業",
    "水産業",
    "漁獲量",
    "養殖",
    "漁業就業者",
    "漁業産出額",
    "漁港",
    "海面漁業",
    "内水面漁業",
    "都道府県",
    "ランキング"
  ],
  "relatedArticleTagKeys": [
    "fishery",
    "fish-catch",
    "aquaculture",
    "fisheries-industry"
  ]
};
