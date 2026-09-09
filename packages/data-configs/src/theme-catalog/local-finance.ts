import type { ThemeCatalog } from "./types";

export const LOCAL_FINANCE_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "財源の余力・経常経費・返済・将来負担を比較。都道府県の普通会計を中心に示します。",
    "headlineRankingKeys": [
      "fiscal-strength-index-prefecture",
      "current-balance-ratio",
      "real-public-debt-service-ratio",
      "future-burden-ratio"
    ],
    "comparisonRankingKeys": [
      "fiscal-strength-index-prefecture",
      "current-balance-ratio",
      "real-public-debt-service-ratio",
      "future-burden-ratio",
      "real-balance-ratio",
      "local-tax-ratio-pref-finance",
      "local-allocation-tax-ratio-pref-finance",
      "national-treasury-disbursement-ratio-pref-finance"
    ],
    "mapNotes": {
      "fiscal-strength-index-prefecture": "基準財政収入額÷基準財政需要額の3年平均。",
      "current-balance-ratio": "経常収入の使途が固定される割合。高いほど財政の弾力性が小さくなります。",
      "real-public-debt-service-ratio": "実質的な公債費負担の3年平均。金額や借金残高ではありません。",
      "future-burden-ratio": "充当可能財源等を控除した将来負担の比率。借金総額ではありません。",
      "real-balance-ratio": "実質収支÷標準財政規模。黒字幅の大きさだけで健全性は判断できません。",
      "local-tax-ratio-pref-finance": "都道府県の歳入総額に占める地方税。市町村財政との合計ではありません。",
      "local-allocation-tax-ratio-pref-finance": "都道府県の歳入総額に占める地方交付税。",
      "national-treasury-disbursement-ratio-pref-finance": "都道府県の歳入総額に占める国庫支出金。"
    }
  },
  "key": "local-finance",
  "title": "地方財政",
  "description": "都道府県別の財政力指数・経常収支比率・実質公債費比率・歳出構造をランキングとチャートで比較。地方税割合、交付税依存度、将来負担比率など主要財政指標の推移を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "primary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "財源の充実度を上部に置き、経常経費と負担の指標と読み分ける。"
      }
    },
    {
      "rankingKey": "current-balance-ratio",
      "shortLabel": "経常収支比率",
      "role": "primary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "財政構造の弾力性を上部に置く。高い順位を良い順位と着色しない。"
      }
    },
    {
      "rankingKey": "real-public-debt-service-ratio",
      "shortLabel": "実質公債費比率",
      "role": "primary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "毎年の返済が財政を圧迫する度合いを上部で示す。"
      }
    },
    {
      "rankingKey": "future-burden-ratio",
      "shortLabel": "将来負担比率",
      "role": "primary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "将来負担の蓄積を毎年の返済負担とは別軸として上部に置く。"
      }
    },
    {
      "rankingKey": "real-balance-ratio",
      "shortLabel": "実質収支比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "当年度の実質収支を比較表で補足する。"
      }
    },
    {
      "rankingKey": "local-tax-ratio-pref-finance",
      "shortLabel": "地方税割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "地方財政白書に基づくデジタル庁の歳入構成の比較にならい、歳入総額に対する割合で財源を読み分ける。"
      }
    },
    {
      "rankingKey": "local-allocation-tax-ratio-pref-finance",
      "shortLabel": "交付税割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "地方財政白書に基づくデジタル庁の歳入構成の比較にならい、歳入総額に対する割合で財源を読み分ける。"
      }
    },
    {
      "rankingKey": "national-treasury-disbursement-ratio-pref-finance",
      "shortLabel": "国庫支出金割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "デジタル庁・総務省「地方財政の財政項目の説明（令和8年版地方財政白書等）」",
        "sourceUrl": "https://www.digital.go.jp/resources/japandashboard/local-finance-introduction",
        "surveyedAt": "2026-09-09",
        "rationale": "地方財政白書に基づくデジタル庁の歳入構成の比較にならい、歳入総額に対する割合で財源を読み分ける。"
      }
    },
    {
      "rankingKey": "self-financing-ratio",
      "shortLabel": "自主財源割合",
      "role": "context"
    },
    {
      "rankingKey": "per-capita-total-expenditure-pref-municipal",
      "shortLabel": "1人当たり歳出",
      "role": "context"
    },
    {
      "rankingKey": "personnel-expenditure-ratio-pref-finance",
      "shortLabel": "人件費割合",
      "role": "context"
    },
    {
      "rankingKey": "assistance-expenditure-ratio-pref-finance",
      "shortLabel": "扶助費割合",
      "role": "context"
    },
    {
      "rankingKey": "investment-expenditure-ratio-pref-finance",
      "shortLabel": "投資的経費割合",
      "role": "context"
    },
    {
      "rankingKey": "welfare-expenditure-ratio-pref-finance",
      "shortLabel": "民生費割合",
      "role": "context"
    },
    {
      "rankingKey": "education-expenditure-ratio-pref-finance",
      "shortLabel": "教育費割合",
      "role": "context"
    },
    {
      "rankingKey": "public-works-expenditure-ratio-pref-finance",
      "shortLabel": "土木費割合",
      "role": "context"
    },
    {
      "rankingKey": "per-capita-inhabitant-tax-pref-municipal",
      "shortLabel": "住民税",
      "role": "context"
    },
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税所得",
      "role": "context"
    },
    {
      "rankingKey": "taxpayer-ratio-per-pref-resident",
      "shortLabel": "納税義務者割合",
      "role": "context"
    },
    {
      "rankingKey": "laspeyres-index-prefecture",
      "shortLabel": "ラスパイレス指数",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-lf-fiscal-ratios-trend",
      "componentType": "line-chart",
      "title": "財政力指数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fiscal-strength-index-prefecture"
          }
        ],
        "labels": [
          "財政力指数"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 10,
      "annotation": "各年度の財政力指数は3年平均です。"
    },
    {
      "componentKey": "theme-lf-current-balance-trend",
      "componentType": "line-chart",
      "title": "経常収支比率の推移",
      "componentProps": {
        "seriesRefs": [{ "metricKey": "current-balance-ratio" }],
        "labels": ["経常収支比率"],
        "seriesColors": ["series-6"]
      },
      "relatedRankingKeys": ["current-balance-ratio"],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 20
    }
  ],
  "evidenceTopics": [
    {
      "key": "revenue-base-and-equalization",
      "lensKey": "composition",
      "title": "自主財源と財源調整の構成",
      "question": "地方税と地方交付税の構成は、地域の財源基盤の違いをどう補っているか。",
      "summary": "財政力指数と歳入構成を組み合わせて読みます。地方税割合と地方交付税割合は歳入総額を分母とする構成比であり、割合だけで財政余力や税負担の大きさは判断できません。",
      "sourceKeys": [
        "mic-local-finance-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture",
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance"
      ],
      "relatedChartKeys": [
        "theme-lf-fiscal-ratios-trend"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "debt-burden-and-soundness",
      "lensKey": "sustainability",
      "title": "公債費と将来負担の持続可能性",
      "question": "現在の公債費負担と将来負担は、地域の財政運営にどのような制約を与えるか。",
      "summary": "実質公債費比率と将来負担比率は、対象期間と算定対象が異なる健全化判断比率です。関連ランキングは2022年度、確報資料は2023年度決算のため、同一年の値として比較しません。",
      "sourceKeys": [
        "mic-fiscal-soundness-ratios-fy2023"
      ],
      "relatedRankingKeys": [
        "real-public-debt-service-ratio",
        "future-burden-ratio"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "地方財政",
    "財政力指数",
    "経常収支比率",
    "実質公債費比率",
    "将来負担比率",
    "地方税",
    "地方交付税",
    "歳出構造",
    "都道府県",
    "ランキング"
  ]
};
