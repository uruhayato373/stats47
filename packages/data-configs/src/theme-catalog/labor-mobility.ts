import type { ThemeCatalog } from "./types";

export const LABOR_MOBILITY_CATALOG: ThemeCatalog = {
  "key": "labor-mobility",
  "title": "人材流動性・雇用環境",
  "description": "求人・失業から雇用の需給を、離職・転職から仕事の移動を読み分ける。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "turnover-rate",
      "shortLabel": "離職率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "離職率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "job-change-rate",
      "shortLabel": "転職率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "転職率は「離職と転職」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "有効求人倍率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "失業率は「求人と失業の需給」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就職率（公共職業安定所）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "公共職業安定所の就職率を求人・求職と職業紹介の章に配置する。人口の就業率とは区別する。"
      }
    },
    {
      "rankingKey": "telework-rate",
      "shortLabel": "テレワーク率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/shugyou/2022/index.html",
        "surveyedAt": "2026-09-08",
        "rationale": "テレワーク率は「就業の状態と働き方」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "side-job-rate",
      "shortLabel": "副業率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/shugyou/2022/index.html",
        "surveyedAt": "2026-09-08",
        "rationale": "副業率は「就業の状態と働き方」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "monthly-average-actual-working-hours-male",
      "shortLabel": "月間平均実労働時間（男性）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/F",
        "surveyedAt": "2026-09-08",
        "rationale": "月間平均を基準にした月間平均実労働時間数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "employment-mobility-rate",
      "shortLabel": "就業異動率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/F",
        "surveyedAt": "2026-09-08",
        "rationale": "既存の長期チャートを指標カードからも見つけられるようにする。"
      }
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "既存の通勤流動図に、就業・通学地への集中を読むための基準を付ける。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "labor-mobility-turnover-vs-jobchange",
      "componentType": "line-chart",
      "title": "離職率と転職率の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "turnover-rate"
          },
          {
            "metricKey": "job-change-rate"
          }
        ],
        "labels": [
          "離職率",
          "転職率"
        ],
        "seriesColors": [
          "danger",
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "turnover-rate",
        "job-change-rate"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "turnover",
      "sortOrder": 10
    },
    {
      "componentKey": "md-labor-mobility-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。\n\n離職率と転職率は母集団・期間が異なります。同じ人の流入と流出を示す組合せではありません。\n\n働き方と昼夜間人口を確認します。昼夜間人口比率には通勤だけでなく通学も含まれます。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 経済財政白書 (令和7年版) / 賃金構造基本統計調査 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 20
    },
    {
      "componentKey": "md-labor-mobility-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 求人と失業の需給を見るときの注意は？\n\n求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n人の移動、就業状態、職業紹介の結果を分けて読みます。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 厚生労働白書 (令和7年版) / 三位一体の労働市場改革 (内閣官房)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-lm-employment-mobility-trend",
      "componentType": "line-chart",
      "title": "就業異動率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "employment-mobility-rate"
          }
        ],
        "labels": [
          "就業異動率"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "employment-mobility-rate"
      ],
      "sourceName": "総務省 社会・人口統計体系（労働）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "employment-mobility",
      "sortOrder": 40
    }
  ],
  "evidenceTopics": [
    {
      "key": "job-separation-and-change",
      "lensKey": "mobility",
      "title": "離職・転職・就業異動の違い",
      "question": "離職、転職、新規就業を分けると、地域の就業異動はどう見えるか。",
      "summary": "2022年就業構造基本調査の1年前との状態変化を読む。離職率は継続就業者・転職者・離職者の合計、転職率は現在の有業者、就業異動率は15歳以上人口が分母で互いに異なるため、率の大小をそのまま差し引かない。",
      "sourceKeys": [
        "stat-employment-status-survey-2022"
      ],
      "relatedRankingKeys": [
        "turnover-rate",
        "job-change-rate",
        "employment-mobility-rate"
      ],
      "relatedChartKeys": [
        "labor-mobility-turnover-vs-jobchange",
        "theme-lm-employment-mobility-trend"
      ],
      "relatedThemeKeys": [
        "labor-wages",
        "local-economy"
      ]
    },
    {
      "key": "telework-participation",
      "lensKey": "participation",
      "title": "テレワーク実施の地域差",
      "question": "有業者のうちテレワークを実施した人の割合には、どのような地域差があるか。",
      "summary": "2022年の有業者を分母に、テレワークを実施した人の割合を比べる単年の構造調査である。産業・職業構成の違いを含むため、地域差を通信環境や制度の効果だけで説明せず、時系列変化とも解釈しない。",
      "sourceKeys": [
        "stat-employment-status-survey-2022"
      ],
      "relatedRankingKeys": [
        "telework-rate"
      ],
      "relatedThemeKeys": [
        "labor-wages",
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "離職率",
    "転職率",
    "有効求人倍率",
    "テレワーク",
    "人材流動性",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "job-market",
      "title": "求人・求職と職業紹介",
      "description": "求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。",
      "metricGroupKeys": [
        "job-market-1",
        "job-market-2",
        "job-market-3"
      ],
      "chartKeys": []
    },
    {
      "key": "turnover",
      "title": "離職と転職",
      "description": "離職率と転職率は母集団・期間が異なります。同じ人の流入と流出を示す組合せではありません。",
      "metricGroupKeys": [
        "turnover"
      ],
      "chartKeys": [
        "labor-mobility-turnover-vs-jobchange"
      ]
    },
    {
      "key": "work-style",
      "title": "就業の状態と働き方",
      "description": "働き方と昼夜間人口を確認します。昼夜間人口比率には通勤だけでなく通学も含まれます。",
      "metricGroupKeys": [
        "work-style"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "commute-flow"
      ]
    },
    {
      "key": "employment-mobility",
      "title": "就業異動率を詳しく見る",
      "description": "就業異動率は15歳以上人口に対する就業状態の変化を示し、離職率・転職率とは分母が異なります。",
      "metricGroupKeys": [
        "employment-mobility"
      ],
      "chartKeys": [
        "theme-lm-employment-mobility-trend"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "人の移動、就業状態、職業紹介の結果を分けて読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-labor-mobility-discussion",
        "md-labor-mobility-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "job-market-1",
      "title": "有効求人倍率",
      "rankingKeys": [
        "active-job-opening-ratio"
      ],
      "defaultCheckedKeys": [
        "active-job-opening-ratio"
      ]
    },
    {
      "key": "job-market-2",
      "title": "失業率",
      "rankingKeys": [
        "unemployment-rate"
      ],
      "defaultCheckedKeys": [
        "unemployment-rate"
      ]
    },
    {
      "key": "job-market-3",
      "title": "就職率（公共職業安定所）",
      "rankingKeys": [
        "employment-rate"
      ],
      "defaultCheckedKeys": [
        "employment-rate"
      ]
    },
    {
      "key": "turnover",
      "title": "離職と転職",
      "rankingKeys": [
        "turnover-rate",
        "job-change-rate"
      ],
      "defaultCheckedKeys": [
        "turnover-rate",
        "job-change-rate"
      ]
    },
    {
      "key": "work-style",
      "title": "就業の状態と働き方",
      "rankingKeys": [
        "telework-rate",
        "day-time-population-ratio"
      ],
      "defaultCheckedKeys": [
        "telework-rate",
        "day-time-population-ratio"
      ]
    },
    {
      "key": "employment-mobility",
      "title": "就業異動率を詳しく見る",
      "rankingKeys": [
        "employment-mobility-rate"
      ],
      "defaultCheckedKeys": [
        "employment-mobility-rate"
      ]
    }
  ]
};
