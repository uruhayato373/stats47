import type { ThemeCatalog } from "./types";

export const POPULATION_DYNAMICS_CATALOG: ThemeCatalog = {
  "key": "population-dynamics",
  "title": "人口動態",
  "description": "人口はどれだけ変わり、その変化は出生・死亡と転入・転出のどちらで生じているかを把握する。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総人口は「人口は増えているか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "出生行動の指標は少子高齢化側で解説し、ここでは人口変化の実数・率を優先する。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "moving-in-excess-rate",
      "shortLabel": "転入超過率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "転入超過率は「どこからどこへ移動するか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢化構造の主責務を少子高齢化へ寄せる。人口構造図に必要な依存は保持する。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "人口増減率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "自然増減率は「出生と死亡・転入と転出の内訳」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "crude-birth-rate",
      "shortLabel": "粗出生率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "粗出生率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "crude-death-rate",
      "shortLabel": "死亡率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "死亡率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "公開最新2019年のため現状把握の主画面へ昇格しない。歴史参考として保持し更新後に再判定。"
      }
    },
    {
      "rankingKey": "young-population-ratio",
      "shortLabel": "年少人口割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年少人口割合は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度（可住地1km²当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地1km²を基準にした可住地面積１km2当たり人口密度として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "昼夜間人口比率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "births",
      "shortLabel": "出生数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "出生数は「出生と死亡・転入と転出の内訳」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "death-count",
      "shortLabel": "死亡数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "死亡数は「出生と死亡・転入と転出の内訳」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "movers-in",
      "shortLabel": "外国人転入者数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "転入者数は「出生と死亡・転入と転出の内訳」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "movers-out",
      "shortLabel": "外国人転出者数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "転出者数は「出生と死亡・転入と転出の内訳」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "metricGroups": [
    {
      "key": "population-change-1",
      "title": "人口増減率",
      "rankingKeys": [
        "population-growth-rate"
      ],
      "defaultCheckedKeys": [
        "population-growth-rate"
      ]
    },
    {
      "key": "population-change-2",
      "title": "総人口",
      "rankingKeys": [
        "total-population"
      ],
      "defaultCheckedKeys": [
        "total-population"
      ]
    },
    {
      "key": "natural-social-change",
      "title": "出生と死亡・転入と転出の内訳",
      "rankingKeys": [
        "natural-increase-rate"
      ],
      "defaultCheckedKeys": [
        "natural-increase-rate"
      ]
    }
  ],
  "charts": [
    {
      "componentKey": "birth-death-count-trend",
      "componentType": "line-chart",
      "title": "自然増減：出生数と死亡数",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "births",
            "label": "出生数",
            "colorRole": "improve"
          },
          {
            "metricKey": "death-count",
            "label": "死亡数",
            "colorRole": "neutral"
          }
        ]
      },
      "relatedRankingKeys": [
        "births",
        "death-count"
      ],
      "sourceName": "総務省 社会・人口統計体系（人口動態統計）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "natural-social-change",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-pop-migration-trend",
      "componentType": "line-chart",
      "title": "外国人の人口移動：転入者数と転出者数",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "movers-in",
            "label": "外国人転入者数",
            "colorRole": "population"
          },
          {
            "metricKey": "movers-out",
            "label": "外国人転出者数",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "movers-in",
        "movers-out"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "natural-social-change",
      "sortOrder": 20
    },
    {
      "componentKey": "md-population-dynamics-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "人口の規模と増減を分けて確かめます。各指標の対象年は同じとは限りません。\n\n出生・死亡と転入・転出を別々に確認します。出典・対象期間の違う数値を足し合わせて人口増減を再計算しないでください。転入・転出の系列は外国人移動者を対象とします。\n\n地域間の移動方向を確認します。移動の集計対象と基準年は図ごとに確認できます。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 少子化社会対策白書 (令和6年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "md-population-dynamics-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 人口は増えているかを見るときの注意は？\n\n人口の規模と増減を分けて確かめます。各指標の対象年は同じとは限りません。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n年齢別の人口構造は少子高齢化テーマで詳しく確認できます。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 少子化社会対策白書 (令和6年版)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    }
  ],
  "evidenceTopics": [
    {
      "key": "natural-population-change",
      "lensKey": "outcomes",
      "title": "出生と死亡から見る自然増減",
      "question": "出生と死亡の差は、地域の自然増減にどのように表れているか。",
      "summary": "人口動態統計の出生・死亡と自然増減率を結び付けます。粗出生率・粗死亡率は人口規模で標準化した率であり、出生数・死亡数そのものとは区別して読みます。",
      "sourceKeys": [
        "mhlw-vital-statistics-2024"
      ],
      "relatedRankingKeys": [
        "natural-increase-rate",
        "crude-birth-rate",
        "crude-death-rate"
      ],
      "relatedChartKeys": [
        "birth-death-count-trend"
      ],
      "relatedThemeKeys": [
        "aging-society"
      ]
    },
    {
      "key": "age-structure-balance",
      "lensKey": "composition",
      "title": "年少人口と高齢人口の構成",
      "question": "年少人口と65歳以上人口の構成には、どのような地域差があるか。",
      "summary": "人口推計の年齢3区分を、総人口に占める構成比として読みます。割合の差は人口規模の差を示さず、将来人口の予測値でもありません。",
      "sourceKeys": [
        "stat-population-estimates-2024"
      ],
      "relatedRankingKeys": [
        "young-population-ratio",
        "ratio-65-plus"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "aging-society"
      ]
    }
  ],
  "keywords": [
    "人口動態",
    "人口増減率",
    "自然増減率",
    "社会増減率",
    "高齢化率",
    "出生率",
    "死亡率",
    "転入超過",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "population-change",
      "title": "人口は増えているか",
      "description": "人口の規模と増減を分けて確かめます。各指標の対象年は同じとは限りません。",
      "metricGroupKeys": [
        "population-change-1",
        "population-change-2"
      ],
      "chartKeys": []
    },
    {
      "key": "natural-social-change",
      "title": "出生と死亡・転入と転出の内訳",
      "description": "出生・死亡と転入・転出を別々に確認します。出典・対象期間の違う数値を足し合わせて人口増減を再計算しないでください。転入・転出の系列は外国人移動者を対象とします。",
      "metricGroupKeys": [
        "natural-social-change"
      ],
      "chartKeys": [
        "birth-death-count-trend",
        "theme-pop-migration-trend"
      ]
    },
    {
      "key": "migration",
      "title": "どこからどこへ移動するか",
      "description": "地域間の移動方向を確認します。移動の集計対象と基準年は図ごとに確認できます。",
      "metricGroupKeys": [],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "migration-flow"
      ]
    },
    {
      "key": "reading",
      "title": "読み方と関連する人口構造",
      "description": "年齢別の人口構造は少子高齢化テーマで詳しく確認できます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-population-dynamics-discussion",
        "md-population-dynamics-faq"
      ]
    }
  ]
};
