import type { ThemeCatalog } from "./types";
import { buildPopulationPyramidSeriesRefs } from "./population-pyramid-deps";

export const AGING_SOCIETY_CATALOG: ThemeCatalog = {
  "key": "aging-society",
  "title": "少子高齢化",
  "description": "出生の状況と年齢構造、高齢者の暮らす世帯が地域ごとにどう異なるかを把握する。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢化率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "aging-index",
      "shortLabel": "老年化指数（15歳未満人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "老年化指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "合計特殊出生率は主問に直接答える見出し指標として残す。"
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
      "rankingKey": "average-age-of-first-marriage-wife",
      "shortLabel": "初婚年齢(妻)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "初婚年齢(妻)は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総人口の増減結果は人口動態で扱う。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "人口増減の要因分解へ集約する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
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
        "rationale": "居住移動の説明は人口動態を主責務とする。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "dependent-population-index",
      "shortLabel": "従属人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "従属人口指数は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "household-ratio-with-65plus",
      "shortLabel": "65歳以上世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "65歳以上世帯割合は「高齢者はどの世帯で暮らすか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "marriages-per-total-population",
      "shortLabel": "婚姻率（人口千人）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "婚姻率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "divorces-per-total-population",
      "shortLabel": "離婚率（人口千人）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "離婚率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
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
        "rationale": "出生実数と死亡実数の自然増減図を人口動態へ集約する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
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
        "rationale": "人口動態の自然増減図と重複する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "late-elderly-medical-expense-per-insured",
      "shortLabel": "後期高齢者医療費（被保険者1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/J",
        "surveyedAt": "2026-09-08",
        "rationale": "被保険者1人を基準にした後期高齢者医療費として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総人口は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯（一般世帯に対して）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢化率と出生中心の主表示に暮らしの形を加える。既存の高齢世帯チャートと一章へ統合。"
      }
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦のみの世帯の割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢夫婦のみの世帯の割合は「高齢者はどの世帯で暮らすか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "pension-benefit-total",
      "shortLabel": "厚生年金受給権者年金総額",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "厚生年金受給権者年金総額は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-15plus",
      "shortLabel": "ボランティア活動の年間行動者率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "15歳以上の一般的社会参加であり高齢者固有の参加率ではない。 主表示は「教育・文化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "young-population-index",
      "shortLabel": "年少人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年少人口指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "old-population-index",
      "shortLabel": "老年人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "老年人口指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "nursing-home-capacity-per-1000-65plus",
      "shortLabel": "老人ホーム定員（65歳以上千人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢化率だけでは見えない施設供給を、同じ高齢者人口基準で比較する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-late-elderly-medical-expense-trend",
      "componentType": "line-chart",
      "title": "後期高齢者医療費（被保険者1人当たり）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "late-elderly-medical-expense-per-insured",
            "label": "後期高齢者医療費（被保険者1人当たり）"
          }
        ],
        "labels": [
          "後期高齢者医療費（被保険者1人当たり）"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "late-elderly-medical-expense-per-insured"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "estat",
      "section": "elderly-care",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-age-composition",
      "componentType": "composition-chart",
      "title": "年齢3区分人口構成の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "theme-age-composition-young-population",
            "label": "年少人口(0〜14歳)",
            "colorRole": "improve"
          },
          {
            "metricKey": "theme-age-composition-production-age-population",
            "label": "生産年齢人口(15〜64歳)",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-age-composition-elderly-population",
            "label": "老年人口(65歳以上)",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "ratio-65-plus"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "age-structure",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-population-pyramid",
      "componentType": "pyramid-chart",
      "title": "人口ピラミッド",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "theme-population-pyramid-0-4-male",
            "label": "0〜4歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-0-4-female",
            "label": "0〜4歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-5-9-male",
            "label": "5〜9歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-5-9-female",
            "label": "5〜9歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-10-14-male",
            "label": "10〜14歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-10-14-female",
            "label": "10〜14歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-15-19-male",
            "label": "15〜19歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-15-19-female",
            "label": "15〜19歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-20-24-male",
            "label": "20〜24歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-20-24-female",
            "label": "20〜24歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-25-29-male",
            "label": "25〜29歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-25-29-female",
            "label": "25〜29歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-30-34-male",
            "label": "30〜34歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-30-34-female",
            "label": "30〜34歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-35-39-male",
            "label": "35〜39歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-35-39-female",
            "label": "35〜39歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-40-44-male",
            "label": "40〜44歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-40-44-female",
            "label": "40〜44歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-45-49-male",
            "label": "45〜49歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-45-49-female",
            "label": "45〜49歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-50-54-male",
            "label": "50〜54歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-50-54-female",
            "label": "50〜54歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-55-59-male",
            "label": "55〜59歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-55-59-female",
            "label": "55〜59歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-60-64-male",
            "label": "60〜64歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-60-64-female",
            "label": "60〜64歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-65-69-male",
            "label": "65〜69歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-65-69-female",
            "label": "65〜69歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-70-74-male",
            "label": "70〜74歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-70-74-female",
            "label": "70〜74歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-75-79-male",
            "label": "75〜79歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-75-79-female",
            "label": "75〜79歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-80-plus-male",
            "label": "80歳以上・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-80-plus-female",
            "label": "80歳以上・女性",
            "colorRole": "female"
          }
        ]
      },
      "relatedRankingKeys": [
        "total-population"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "age-structure",
      "sortOrder": 30
    },
    {
      "componentKey": "md-aging-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "高齢者の人口割合と出生の水準を別の尺度として読みます。\n\n人数の構成と男女・年齢階級の分布から、高齢化の背景を確認します。\n\n高齢単独世帯の割合は一般世帯に対する割合です。高齢者本人の独居率とは異なります。"
      },
      "sourceName": "高齢社会白書 (令和6年版) / 厚生労働白書 (令和7年版) / 国土交通白書 2025 / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    },
    {
      "componentKey": "cmp-pop-elderly-household",
      "componentType": "line-chart",
      "title": "高齢世帯の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "household-ratio-with-65plus"
          },
          {
            "metricKey": "single-person-household-old-population-ratio"
          },
          {
            "metricKey": "elderly-couple-only-household-ratio"
          }
        ],
        "labels": [
          "65歳以上世帯員のいる世帯",
          "65歳以上単独世帯",
          "高齢夫婦のみ世帯"
        ],
        "yAxisConfig": {
          "mode": "sync"
        }
      },
      "relatedRankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "sourceName": null,
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "elderly-households",
      "sortOrder": 50
    },
    {
      "componentKey": "md-aging-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 出生と高齢化の現在地を見るときの注意は？\n\n高齢者の人口割合と出生の水準を別の尺度として読みます。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n出生・高齢化・世帯構成は、それぞれ対象者と分母を確認して読みます。"
      },
      "sourceName": "高齢社会白書 (令和6年版) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 60
    }
  ],
  "evidenceTopics": [
    {
      "key": "regional-aging-composition",
      "lensKey": "composition",
      "title": "地域別の高齢化と年齢構成",
      "question": "65歳以上人口割合と年齢3区分の構成には、地域ごとにどのような差があるか",
      "summary": "高齢化率は65歳以上人口を総人口で割った割合で、65歳以上人口の絶対数ではありません。年少・生産年齢・老年人口の構成と合わせ、分子と分母の変化を分けて読みます。",
      "sourceKeys": [
        "cao-aging-whitepaper-2025-regional-aging"
      ],
      "relatedRankingKeys": [
        "ratio-65-plus"
      ],
      "relatedChartKeys": [
        "theme-age-composition"
      ]
    },
    {
      "key": "elderly-household-composition",
      "lensKey": "composition",
      "title": "高齢者が暮らす世帯の構成",
      "question": "高齢者のいる世帯、単独世帯、高齢夫婦のみの世帯には、地域ごとにどのような差があるか",
      "summary": "関連ランキングの3指標は、それぞれ該当する世帯数を一般世帯数で割った割合です。高齢者のいる世帯だけを分母にした構成比ではないため、3指標を足して100％になるとは限りません。",
      "sourceKeys": [
        "cao-aging-whitepaper-2025-households"
      ],
      "relatedRankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "relatedChartKeys": [
        "cmp-pop-elderly-household"
      ]
    }
  ],
  "keywords": [
    "少子高齢化",
    "高齢化率",
    "合計特殊出生率",
    "人口減少",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "birth-aging",
      "title": "出生と高齢化の現在地",
      "description": "高齢者の人口割合と出生の水準を別の尺度として読みます。",
      "metricGroupKeys": [
        "birth-aging-1",
        "birth-aging-2"
      ],
      "chartKeys": []
    },
    {
      "key": "age-structure",
      "title": "年齢構造はどう変わるか",
      "description": "人数の構成と男女・年齢階級の分布から、高齢化の背景を確認します。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-age-composition",
        "theme-population-pyramid"
      ]
    },
    {
      "key": "elderly-households",
      "title": "高齢者はどの世帯で暮らすか",
      "description": "高齢単独世帯の割合は一般世帯に対する割合です。高齢者本人の独居率とは異なります。",
      "metricGroupKeys": [
        "elderly-households"
      ],
      "chartKeys": [
        "cmp-pop-elderly-household"
      ]
    },
    {
      "key": "elderly-care",
      "title": "医療アクセスと費用",
      "description": "老人ホーム定員は65歳以上人口千人当たりです。空き定員や入所需要の充足率を表すものではありません。医療費とアクセスは別の側面として確認します。",
      "metricGroupKeys": [
        "elderly-care"
      ],
      "chartKeys": [
        "theme-late-elderly-medical-expense-trend"
      ],
      "embeddedSectionKeys": [
        "depopulation-medical"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "出生・高齢化・世帯構成は、それぞれ対象者と分母を確認して読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-aging-discussion",
        "md-aging-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "birth-aging-1",
      "title": "高齢化率",
      "rankingKeys": [
        "ratio-65-plus"
      ],
      "defaultCheckedKeys": [
        "ratio-65-plus"
      ]
    },
    {
      "key": "birth-aging-2",
      "title": "合計特殊出生率",
      "rankingKeys": [
        "total-fertility-rate"
      ],
      "defaultCheckedKeys": [
        "total-fertility-rate"
      ]
    },
    {
      "key": "elderly-households",
      "title": "高齢者はどの世帯で暮らすか",
      "rankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "defaultCheckedKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio"
      ]
    },
    {
      "key": "elderly-care",
      "title": "医療アクセスと費用",
      "rankingKeys": [
        "nursing-home-capacity-per-1000-65plus"
      ],
      "defaultCheckedKeys": [
        "nursing-home-capacity-per-1000-65plus"
      ]
    }
  ]
};
