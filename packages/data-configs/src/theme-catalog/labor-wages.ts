import type { ThemeCatalog } from "./types";

export const LABOR_WAGES_CATALOG: ThemeCatalog = {
  "key": "labor-wages",
  "title": "労働・賃金",
  "description": "都道府県別の最低賃金、初任給、給与月額、男女の給与水準差、パート時給を、対象者と時間単位を分けて比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "最低賃金は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "starting-salary-university",
      "shortLabel": "大卒初任給",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-08",
        "rationale": "大卒初任給は「初任給はいくらか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "starting-salary-highschool",
      "shortLabel": "高卒初任給",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-08",
        "rationale": "高卒初任給は「初任給はいくらか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "scheduled-salary-male",
      "shortLabel": "所定内給与(男)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "所定内給与(男)は「属性別の賃金差」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "nurse-salary",
      "shortLabel": "看護師の所定内給与月額",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-08",
        "rationale": "configは看護師の所定内給与額（千円）であり「年収」表示は不一致。職業別年収と同義にせず、月給参考へ移すかテーマ掲載を外す。 主表示は「職業別年収」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "gender-wage-gap",
      "shortLabel": "男女賃金格差",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "男女賃金格差は「属性別の賃金差」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "male-part-time-hourly-wage",
      "shortLabel": "パート時給（男性）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/F",
        "surveyedAt": "2026-09-08",
        "rationale": "時給を基準にした男性パートタイムの給与として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "female-part-time-hourly-wage",
      "shortLabel": "パート時給(女)",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "パート時給(女)は「属性別の賃金差」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "求人・失業・離職は雇用環境で一体的に読む。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "雇用環境の需給章に集約する。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就職率（公共職業安定所）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "就業状態は雇用環境で読む。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "employed-people-ratio",
      "shortLabel": "有業率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "有業率は雇用環境へ。公共職業安定所の就職率とは対象が異なる。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "telework-rate",
      "shortLabel": "テレワーク率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/shugyou/2022/index.html",
        "surveyedAt": "2026-09-08",
        "rationale": "テレワークを男女賃金格差と同じ主図に重ねない。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
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
        "rationale": "働き方の主責務テーマへ集約する。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
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
      "rankingKey": "turnover-rate",
      "shortLabel": "離職率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "離職率は雇用移動の主指標に集約する。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "regular-cash-salary-male",
      "shortLabel": "現金給与月額（男）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=2&statInfId=000040133614",
        "surveyedAt": "2026-09-08",
        "rationale": "特定職種に依存しない給与の水準を男女同一の定義・年で比較する。"
      }
    },
    {
      "rankingKey": "regular-cash-salary-female",
      "shortLabel": "現金給与月額（女）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=2&statInfId=000040133614",
        "surveyedAt": "2026-09-08",
        "rationale": "特定職種に依存しない給与の水準を男女同一の定義・年で比較する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "labor-wages-gender-gap",
      "componentType": "line-chart",
      "title": "男女賃金格差の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "gender-wage-gap",
            "label": "男女賃金格差",
            "colorRole": "female"
          }
        ]
      },
      "relatedRankingKeys": [
        "gender-wage-gap"
      ],
      "sourceName": "賃金構造基本統計調査",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "wage-differences",
      "sortOrder": 10
    },
    {
      "componentKey": "md-labor-wages-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "地域別最低賃金は時間額です。適用時点と対象年を確認します。\n\n初任給は学歴別の月額です。最低賃金の時間額とは直接比較できません。\n\n給与月額、男女の給与水準比、パート時給を分けて比較します。男女の平均差だけで同じ仕事内容に対する賃金差とは判断できません。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 賃金構造基本統計調査 (厚生労働省) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 地域別最低賃金 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 20
    },
    {
      "componentKey": "md-labor-wages-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 最低賃金はいくらかを見るときの注意は？\n\n地域別最低賃金は時間額です。適用時点と対象年を確認します。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n給与の月額・時間額・対象労働者の範囲を確認します。求人・失業・転職は雇用環境テーマへ接続します。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 賃金構造基本統計調査 (厚生労働省) / 男女共同参画白書 (令和7年版) / 地域別最低賃金 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    }
  ],
  "metricGroups": [
    {
      "key": "minimum-wage",
      "title": "最低賃金はいくらか",
      "rankingKeys": [
        "minimum-wage-by-region"
      ],
      "defaultCheckedKeys": [
        "minimum-wage-by-region"
      ]
    },
    {
      "key": "starting-pay",
      "title": "初任給はいくらか",
      "rankingKeys": [
        "starting-salary-university",
        "starting-salary-highschool"
      ],
      "defaultCheckedKeys": [
        "starting-salary-university",
        "starting-salary-highschool"
      ]
    },
    {
      "key": "wage-differences-1",
      "title": "男女賃金格差",
      "rankingKeys": [
        "gender-wage-gap"
      ],
      "defaultCheckedKeys": [
        "gender-wage-gap"
      ]
    },
    {
      "key": "wage-differences-2",
      "title": "パート時給(男)・パート時給(女)",
      "rankingKeys": [
        "male-part-time-hourly-wage",
        "female-part-time-hourly-wage"
      ],
      "defaultCheckedKeys": [
        "male-part-time-hourly-wage",
        "female-part-time-hourly-wage"
      ]
    },
    {
      "key": "wage-differences-3",
      "title": "現金給与月額（男）・現金給与月額（女）",
      "rankingKeys": [
        "regular-cash-salary-male",
        "regular-cash-salary-female"
      ],
      "defaultCheckedKeys": [
        "regular-cash-salary-male",
        "regular-cash-salary-female"
      ]
    }
  ],
  "evidenceTopics": [
    {
      "key": "labor-market-tightness",
      "lensKey": "service-capacity",
      "title": "求人と失業から見る労働需給",
      "question": "有効求人倍率と完全失業率は、地域の仕事の需給をそれぞれどう映しているか。",
      "summary": "有効求人倍率は公共職業安定所の求人・求職、完全失業率は国勢調査の労働力人口を基礎にします。調査対象と時点が異なるため、数値を直接差し引いて比較はできません。",
      "sourceKeys": [
        "mhlw-labor-economy-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "active-job-opening-ratio",
        "unemployment-rate"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "labor-mobility"
      ]
    },
    {
      "key": "gender-wage-equity",
      "lensKey": "equity",
      "title": "男女の所定内給与水準",
      "question": "男性を100とした女性の所定内給与水準には、どのような地域差があるか。",
      "summary": "一般労働者の所定内給与額を男女で比べた未調整の比率です。短時間労働者を含まず、年齢、勤続年数、職種などの構成差を調整した格差ではありません。",
      "sourceKeys": [
        "mhlw-wage-structure-survey"
      ],
      "relatedRankingKeys": [
        "gender-wage-gap"
      ],
      "relatedChartKeys": [
        "labor-wages-gender-gap"
      ],
      "relatedThemeKeys": [
        "occupation-salary"
      ]
    }
  ],
  "keywords": [
    "最低賃金",
    "初任給",
    "有効求人倍率",
    "失業率",
    "男女賃金格差",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "minimum-wage",
      "title": "最低賃金はいくらか",
      "description": "地域別最低賃金は時間額です。適用時点と対象年を確認します。",
      "metricGroupKeys": [
        "minimum-wage"
      ],
      "chartKeys": []
    },
    {
      "key": "starting-pay",
      "title": "初任給はいくらか",
      "description": "初任給は学歴別の月額です。最低賃金の時間額とは直接比較できません。",
      "metricGroupKeys": [
        "starting-pay"
      ],
      "chartKeys": []
    },
    {
      "key": "wage-differences",
      "title": "属性別の賃金差",
      "description": "給与月額、男女の給与水準比、パート時給を分けて比較します。男女の平均差だけで同じ仕事内容に対する賃金差とは判断できません。",
      "metricGroupKeys": [
        "wage-differences-1",
        "wage-differences-2",
        "wage-differences-3"
      ],
      "chartKeys": [
        "labor-wages-gender-gap"
      ]
    },
    {
      "key": "reading",
      "title": "読み方・雇用環境への導線",
      "description": "給与の月額・時間額・対象労働者の範囲を確認します。求人・失業・転職は雇用環境テーマへ接続します。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-labor-wages-discussion",
        "md-labor-wages-faq"
      ]
    }
  ]
};
