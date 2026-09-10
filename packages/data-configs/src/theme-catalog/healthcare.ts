import type { ThemeCatalog } from "./types";

export const HEALTHCARE_CATALOG: ThemeCatalog = {
  "key": "healthcare",
  "title": "医療・健康",
  "description": "医療資源の供給、入院利用と費用、健康アウトカムの違いを順に把握する。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "physicians-in-medical-facilities-per-100k",
      "shortLabel": "医師数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした医師数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "nurses-in-medical-facilities-per-100k",
      "shortLabel": "看護師・准看護師数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした看護師・准看護師数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "general-hospital-count-per-100k",
      "shortLabel": "一般病院数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした一般病院数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "general-hospital-bed-count-per-100k",
      "shortLabel": "一般病院病床数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした一般病院病床数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "pharmacy-count-per-100k",
      "shortLabel": "薬局数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした人口10万人あたり薬局数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "national-medical-expense-per-person",
      "shortLabel": "1人当たり国民医療費",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "1人当たりを基準にした1人当たりの国民医療費として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "general-hospital-avg-length-of-stay",
      "shortLabel": "一般病院の平均在院日数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "平均を基準にした一般病院平均在院日数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "general-hospital-bed-occupancy-rate",
      "shortLabel": "病床利用率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "病床利用率は「入院の供給と利用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "deaths-lifestyle-diseases-per-100k",
      "shortLabel": "生活習慣病死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした生活習慣病による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-diabetes-per-100k",
      "shortLabel": "糖尿病死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした糖尿病による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-malignant-neoplasms-per-100k",
      "shortLabel": "悪性新生物死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした腫瘍による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-heart-disease-excl-hypertensive-per-100k",
      "shortLabel": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした心疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-cerebrovascular-disease-per-100k",
      "shortLabel": "脳血管疾患死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした脳血管疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-hypertensive-diseases-per-100k",
      "shortLabel": "高血圧性疾患死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした高血圧性疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "psychiatric-hospital-count-per-100k",
      "shortLabel": "精神科病院数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした精神科病院数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "treatment-rate-mood-disorder-outpatient",
      "shortLabel": "気分障害の外来受療率（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004026105",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした気分障害（うつ病を含む）の受療率（外来）として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "healthy-life-expectancy-male",
      "shortLabel": "健康寿命（男性）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/content/10904750/001363069.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "医師数・医療費・粗死亡率に偏る現行構成へ健康の結果指標を置く。男女を対で扱う。"
      }
    },
    {
      "rankingKey": "healthy-life-expectancy-female",
      "shortLabel": "健康寿命（女性）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/content/10904750/001363069.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "医師数・医療費・粗死亡率に偏る現行構成へ健康の結果指標を置く。男女を対で扱う。"
      }
    },
    {
      "rankingKey": "ambulance-hospital-arrival-time",
      "shortLabel": "救急搬送の病院収容所要時間",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "供給密度では分からない緊急時のアクセスを追加し、過疎×医療Geoと接続する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-health-supply-trend",
      "componentType": "line-chart",
      "title": "医療施設の医師数の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "physicians-in-medical-facilities-per-100k",
            "label": "医師数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "physicians-in-medical-facilities-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "annotation": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。",
      "section": "supply"
    },
    {
      "componentKey": "theme-health-supply-trend-hospitals",
      "componentType": "line-chart",
      "title": "一般病院数の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "general-hospital-count-per-100k",
            "label": "一般病院数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "general-hospital-count-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "annotation": "総人口10万人当たりの一般病院数です。施設の規模や診療機能の違いは含まれません。",
      "section": "supply"
    },
    {
      "componentKey": "theme-health-expense-trend",
      "componentType": "line-chart",
      "title": "1人当たり医療費の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "national-medical-expense-per-person",
            "label": "1人当たり国民医療費"
          }
        ],
        "labels": [
          "1人当たり国民医療費"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "national-medical-expense-per-person"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "medical-expense",
      "sortOrder": 30
    },
    {
      "componentKey": "md-healthcare-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。\n\n人口10万人当たり病床数、病床利用率、在院日数は別の側面です。値の大小だけで医療の質は判断できません。\n\n1人当たりの医療費は年齢構成や受療状況の影響を受けます。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 地方財政白書 (令和8年版) / 経済財政白書 (令和7年版) / 地域医療構想・病床機能報告 (厚生労働省) / 医師の働き方改革 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    },
    {
      "componentKey": "md-healthcare-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 医療人材と施設を見るときの注意は？\n\n医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n供給・利用・費用・健康結果を分けて読み、単一指標から医療の良し悪しを決めないようにします。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 地域医療構想 (厚生労働省) / 医師の働き方改革 (厚生労働省) / 健康日本21(第三次) (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 50
    },
    {
      "componentKey": "theme-health-death-causes-donut",
      "componentType": "donut-chart",
      "title": "主要5死因内の構成",
      "componentProps": {
        "topN": 5,
        "seriesRefs": [
          {
            "metricKey": "deaths-malignant-neoplasms-per-100k",
            "label": "悪性新生物死亡（日本人人口10万人当たり）",
            "colorRole": "danger"
          },
          {
            "metricKey": "deaths-heart-disease-excl-hypertensive-per-100k",
            "label": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
            "colorRole": "population"
          },
          {
            "metricKey": "deaths-cerebrovascular-disease-per-100k",
            "label": "脳血管疾患死亡（日本人人口10万人当たり）",
            "colorRole": "count"
          },
          {
            "metricKey": "deaths-diabetes-per-100k",
            "label": "糖尿病死亡（日本人人口10万人当たり）",
            "colorRole": "improve"
          },
          {
            "metricKey": "deaths-hypertensive-diseases-per-100k",
            "label": "高血圧性疾患死亡（日本人人口10万人当たり）",
            "colorRole": "special"
          }
        ]
      },
      "relatedRankingKeys": [
        "deaths-malignant-neoplasms-per-100k",
        "deaths-heart-disease-excl-hypertensive-per-100k",
        "deaths-cerebrovascular-disease-per-100k",
        "deaths-diabetes-per-100k",
        "deaths-hypertensive-diseases-per-100k"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "causes-of-death",
      "sortOrder": 60,
      "annotation": "日本人人口10万人当たりの死亡率を使い、同じ地域・年の5死因の合計を100%として示します。各数値は死亡者の実人数ではありません。全死因の構成比や年齢調整死亡率ではありません。"
    }
  ],
  "evidenceTopics": [
    {
      "key": "physician-distribution",
      "lensKey": "service-capacity",
      "title": "医師の地域偏在と医療供給",
      "question": "人口10万人当たりの医療施設従事医師数は、都道府県間でどう異なるか",
      "summary": "医療施設の医師・看護師等・一般病院を人口10万人当たりで確認し、単一指標だけで医療体制全体を判断しません。",
      "sourceKeys": [
        "mhlw-physician-workforce-plan"
      ],
      "relatedRankingKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k",
        "general-hospital-count-per-100k"
      ],
      "relatedChartKeys": [
        "theme-health-supply-trend"
      ]
    },
    {
      "key": "inpatient-capacity-and-use",
      "lensKey": "participation",
      "title": "病床の供給と利用",
      "question": "病床数・病床利用率・平均在院日数は、入院医療の供給と利用をどう分けて示すか",
      "summary": "人口10万人当たり病床数は人口規模に対する供給、利用率は稼働状況、平均在院日数は利用期間として別々に読みます。",
      "sourceKeys": [
        "mhlw-regional-healthcare-vision",
        "mhlw-hospital-function-report-2025"
      ],
      "relatedRankingKeys": [
        "general-hospital-bed-count-per-100k",
        "general-hospital-bed-occupancy-rate",
        "general-hospital-avg-length-of-stay"
      ]
    }
  ],
  "keywords": [
    "医師数",
    "病院数",
    "医療費",
    "医療格差",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "supply",
      "title": "医療人材と施設",
      "description": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。",
      "metricGroupKeys": [
        "supply-1",
        "supply-2"
      ],
      "chartKeys": [
        "theme-health-supply-trend",
        "theme-health-supply-trend-hospitals"
      ]
    },
    {
      "key": "hospital-use",
      "title": "入院の供給と利用",
      "description": "人口10万人当たり病床数、病床利用率、平均在院日数は別の側面です。値の大小だけで医療の質は判断できません。",
      "metricGroupKeys": [
        "hospital-use-1",
        "hospital-use-2",
        "hospital-use-3"
      ],
      "chartKeys": []
    },
    {
      "key": "medical-expense",
      "title": "医療費",
      "description": "1人当たりの医療費は年齢構成や受療状況の影響を受けます。",
      "metricGroupKeys": [
        "medical-expense"
      ],
      "chartKeys": [
        "theme-health-expense-trend"
      ]
    },
    {
      "key": "causes-of-death",
      "title": "主要死因による死亡",
      "description": "日本人人口10万人当たりの死亡率を使い、同じ地域・年の5死因の合計を100%として示します。各数値は死亡者の実人数ではありません。全死因の構成比や年齢調整死亡率ではありません。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-health-death-causes-donut"
      ]
    },
    {
      "key": "healthy-years",
      "title": "健康に生活できる期間",
      "description": "日常生活に制限のない期間の平均を男女別に確認します。推計値のため小さな県差を過度に読み取らないでください。",
      "metricGroupKeys": [
        "healthy-years"
      ],
      "chartKeys": []
    },
    {
      "key": "access",
      "title": "地域の医療アクセス",
      "description": "救急搬送時間は119番通報から医師への引継ぎまでの時間です。現場到着時間や地図の推定移動時間とは異なります。",
      "metricGroupKeys": [
        "access"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "depopulation-medical"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "供給・利用・費用・健康結果を分けて読み、単一指標から医療の良し悪しを決めないようにします。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-healthcare-discussion",
        "md-healthcare-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "supply-1",
      "title": "医師・看護師等（人口10万人当たり）",
      "rankingKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k"
      ],
      "defaultCheckedKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k"
      ]
    },
    {
      "key": "supply-2",
      "title": "一般病院数（人口10万人当たり）",
      "rankingKeys": [
        "general-hospital-count-per-100k"
      ],
      "defaultCheckedKeys": [
        "general-hospital-count-per-100k"
      ]
    },
    {
      "key": "hospital-use-1",
      "title": "一般病院病床数（人口10万人当たり）",
      "rankingKeys": [
        "general-hospital-bed-count-per-100k"
      ],
      "defaultCheckedKeys": [
        "general-hospital-bed-count-per-100k"
      ]
    },
    {
      "key": "hospital-use-2",
      "title": "病床利用率",
      "rankingKeys": [
        "general-hospital-bed-occupancy-rate"
      ],
      "defaultCheckedKeys": [
        "general-hospital-bed-occupancy-rate"
      ]
    },
    {
      "key": "hospital-use-3",
      "title": "一般病院の平均在院日数",
      "rankingKeys": [
        "general-hospital-avg-length-of-stay"
      ],
      "defaultCheckedKeys": [
        "general-hospital-avg-length-of-stay"
      ]
    },
    {
      "key": "medical-expense",
      "title": "1人当たり国民医療費",
      "rankingKeys": [
        "national-medical-expense-per-person"
      ],
      "defaultCheckedKeys": [
        "national-medical-expense-per-person"
      ]
    },
    {
      "key": "healthy-years",
      "title": "健康に生活できる期間",
      "rankingKeys": [
        "healthy-life-expectancy-male",
        "healthy-life-expectancy-female"
      ],
      "defaultCheckedKeys": [
        "healthy-life-expectancy-male",
        "healthy-life-expectancy-female"
      ]
    },
    {
      "key": "access",
      "title": "地域の医療アクセス",
      "rankingKeys": [
        "ambulance-hospital-arrival-time"
      ],
      "defaultCheckedKeys": [
        "ambulance-hospital-arrival-time"
      ]
    }
  ]
};
