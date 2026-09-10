import type { ThemeCatalog } from "./types";

export const OCCUPATION_SALARY_CATALOG: ThemeCatalog = {
  "key": "occupation-salary",
  "title": "職業別年収",
  "description": "都道府県別の職業平均年収を、医療・介護、教育・保育、IT・専門職、運輸・建設、サービスに分けて比較します。職種ごとの対象年と非公表の有無を確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "doctor-annual-income",
      "shortLabel": "医師",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "医師は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "nurse-annual-income",
      "shortLabel": "看護師",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "看護師は「医療・介護」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "pharmacist-annual-income",
      "shortLabel": "薬剤師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "医療・介護の初期表示を3職に絞り、薬剤師は職種selectorから追加する。"
      }
    },
    {
      "rankingKey": "care-worker-annual-income",
      "shortLabel": "介護職員",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "介護職員は「医療・介護」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "nursery-teacher-annual-income",
      "shortLabel": "保育士",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "保育士は「教育・保育」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "midwife-annual-income",
      "shortLabel": "助産師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "助産師は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "practical-nurse-annual-income",
      "shortLabel": "准看護師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "准看護師は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "dental-hygienist-annual-income",
      "shortLabel": "歯科衛生士",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "歯科衛生士は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "dietitian-annual-income",
      "shortLabel": "栄養士",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "栄養士は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "physical-therapist-annual-income",
      "shortLabel": "理学療法士等",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "理学療法士等は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "public-health-nurse-annual-income",
      "shortLabel": "保健師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "保健師は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "nursing-assistant-annual-income",
      "shortLabel": "看護助手",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "看護助手は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "care-manager-annual-income",
      "shortLabel": "ケアマネ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "ケアマネは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "home-care-worker-annual-income",
      "shortLabel": "訪問介護",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "訪問介護は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "system-consultant-annual-income",
      "shortLabel": "SIer/コンサル",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "SEと同時初期表示を必須にせず、IT職種の詳細選択へ置く。"
      }
    },
    {
      "rankingKey": "software-engineer-annual-income",
      "shortLabel": "ソフトウェア作成者",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "SEは「IT・専門職」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "accountant-annual-income",
      "shortLabel": "会計士・税理士",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "会計士・税理士は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "designer-annual-income",
      "shortLabel": "デザイナー",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "デザイナーは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "researcher-annual-income",
      "shortLabel": "研究者",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "研究者は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "school-teacher-annual-income",
      "shortLabel": "小中学校教員",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "小中学校教員は「教育・保育」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "university-professor-annual-income",
      "shortLabel": "大学教授",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "大学教授は「教育・保育」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "associate-professor-annual-income",
      "shortLabel": "大学准教授",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "大学准教授は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "high-school-teacher-annual-income",
      "shortLabel": "高校教員",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高校教員は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "kindergarten-teacher-annual-income",
      "shortLabel": "幼稚園教員",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "幼稚園教員は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "truck-driver-annual-income",
      "shortLabel": "営業用大型貨物自動車運転者",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "トラック運転手は「運輸・建設」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "taxi-driver-annual-income",
      "shortLabel": "タクシー運転手",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "タクシー運転手は「運輸・建設」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "bus-driver-annual-income",
      "shortLabel": "バス運転手",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "バス運転手は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "carpenter-annual-income",
      "shortLabel": "大工",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "大工は「運輸・建設」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "electrician-annual-income",
      "shortLabel": "電気工事",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "電気工事は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "architect-annual-income",
      "shortLabel": "建築技術者",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "建築技術者は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "manager-annual-income",
      "shortLabel": "管理職",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "職務分類であり業種横断の管理職をITの代表にしない。"
      }
    },
    {
      "rankingKey": "cook-annual-income",
      "shortLabel": "調理従事者",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "調理従事者は「サービスと全職種」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "barber-beautician-annual-income",
      "shortLabel": "理容・美容師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "理容・美容師は「サービスと全職種」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "security-guard-annual-income",
      "shortLabel": "警備員",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "警備員は「サービスと全職種」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "sales-clerk-annual-income",
      "shortLabel": "販売店員",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "販売店員は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "cleaning-worker-annual-income",
      "shortLabel": "清掃・廃棄物",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "清掃・廃棄物は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "pilot-annual-income",
      "shortLabel": "パイロット",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "パイロットは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "auto-mechanic-annual-income",
      "shortLabel": "自動車整備",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "自動車整備は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "dentist-annual-income",
      "shortLabel": "歯科医師",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
        "surveyedAt": "2026-09-08",
        "rationale": "歯科医師は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-occ-medical-trend",
      "componentType": "line-chart",
      "title": "医療・福祉職の年収比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "doctor-annual-income",
            "label": "医師",
            "colorRole": "population"
          },
          {
            "metricKey": "nurse-annual-income",
            "label": "看護師",
            "colorRole": "improve"
          },
          {
            "metricKey": "care-worker-annual-income",
            "label": "介護職員",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "doctor-annual-income",
        "nurse-annual-income",
        "care-worker-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "medical-care",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-occ-it-trend",
      "componentType": "line-chart",
      "title": "IT・専門職の年収比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "system-consultant-annual-income",
            "label": "SIer/コンサル",
            "colorRole": "population"
          },
          {
            "metricKey": "software-engineer-annual-income",
            "label": "ソフトウェア作成者",
            "colorRole": "special"
          }
        ]
      },
      "relatedRankingKeys": [
        "system-consultant-annual-income",
        "software-engineer-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "it-professional",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-occ-edu-trend",
      "componentType": "line-chart",
      "title": "教育職の年収比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "school-teacher-annual-income",
            "label": "小中学校教員",
            "colorRole": "population"
          },
          {
            "metricKey": "university-professor-annual-income",
            "label": "大学教授",
            "colorRole": "danger"
          },
          {
            "metricKey": "nursery-teacher-annual-income",
            "label": "保育士",
            "colorRole": "series-3"
          }
        ]
      },
      "relatedRankingKeys": [
        "school-teacher-annual-income",
        "university-professor-annual-income",
        "nursery-teacher-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "education",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-occ-transport-trend",
      "componentType": "line-chart",
      "title": "運輸・建設職の年収比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "truck-driver-annual-income",
            "label": "営業用大型貨物自動車運転者",
            "colorRole": "population"
          },
          {
            "metricKey": "taxi-driver-annual-income",
            "label": "タクシー運転手",
            "colorRole": "count"
          },
          {
            "metricKey": "carpenter-annual-income",
            "label": "大工",
            "colorRole": "neutral"
          }
        ]
      },
      "relatedRankingKeys": [
        "truck-driver-annual-income",
        "taxi-driver-annual-income",
        "carpenter-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "transport-construction",
      "sortOrder": 40
    },
    {
      "componentKey": "theme-occ-service-trend",
      "componentType": "line-chart",
      "title": "サービス職の年収比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "cook-annual-income",
            "label": "調理従事者",
            "colorRole": "count"
          },
          {
            "metricKey": "barber-beautician-annual-income",
            "label": "理容・美容師",
            "colorRole": "special"
          },
          {
            "metricKey": "security-guard-annual-income",
            "label": "警備員",
            "colorRole": "neutral"
          }
        ]
      },
      "relatedRankingKeys": [
        "cook-annual-income",
        "barber-beautician-annual-income",
        "security-guard-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "services",
      "sortOrder": 50
    }
  ],
  "metricGroups": [
    {
      "key": "medical-care",
      "title": "医療・介護",
      "rankingKeys": [
        "doctor-annual-income",
        "nurse-annual-income",
        "care-worker-annual-income"
      ],
      "defaultCheckedKeys": [
        "doctor-annual-income",
        "nurse-annual-income"
      ]
    },
    {
      "key": "education",
      "title": "教育・保育",
      "rankingKeys": [
        "school-teacher-annual-income",
        "nursery-teacher-annual-income"
      ],
      "defaultCheckedKeys": [
        "school-teacher-annual-income",
        "nursery-teacher-annual-income"
      ]
    },
    {
      "key": "it-professional",
      "title": "IT・専門職",
      "rankingKeys": [
        "software-engineer-annual-income"
      ],
      "defaultCheckedKeys": [
        "software-engineer-annual-income"
      ]
    },
    {
      "key": "transport-construction",
      "title": "運輸・建設",
      "rankingKeys": [
        "truck-driver-annual-income",
        "taxi-driver-annual-income"
      ],
      "defaultCheckedKeys": [
        "truck-driver-annual-income",
        "taxi-driver-annual-income"
      ]
    }
  ],
  "evidenceTopics": [
    {
      "key": "medical-care-pay-structure",
      "lensKey": "equity",
      "title": "医療・介護職の賃金構造",
      "question": "医師・看護師・介護職員の推計年収には、どのような地域差があるか。",
      "summary": "一般労働者・男女計の6月のきまって支給する現金給与額を12倍し、前年の賞与等を加えた税・社会保険料控除前の標本平均で比べる。年齢、勤続年数、事業所規模などの構成差は調整していないため、地域そのものの賃金効果とは限らない。",
      "sourceKeys": [
        "mhlw-wage-structure-survey"
      ],
      "relatedRankingKeys": [
        "doctor-annual-income",
        "nurse-annual-income",
        "care-worker-annual-income"
      ],
      "relatedChartKeys": [
        "theme-occ-medical-trend"
      ],
      "relatedThemeKeys": [
        "labor-wages",
        "healthcare"
      ]
    },
    {
      "key": "it-occupation-pay-comparison",
      "lensKey": "composition",
      "title": "IT職種区分ごとの推計年収",
      "question": "システムコンサルタント等とソフトウェア作成者の推計年収は、地域ごとにどう異なるか。",
      "summary": "別々の職種区分について、一般労働者・男女計の6月のきまって支給する現金給与額を年換算し前年賞与等を加えた標本平均を比較する。個人の実年収ではなく、年齢、勤続年数、事業所規模などの構成差も調整していない。",
      "sourceKeys": [
        "mhlw-wage-structure-survey"
      ],
      "relatedRankingKeys": [
        "system-consultant-annual-income",
        "software-engineer-annual-income"
      ],
      "relatedChartKeys": [
        "theme-occ-it-trend"
      ],
      "relatedThemeKeys": [
        "labor-wages"
      ]
    }
  ],
  "keywords": [
    "職業別年収",
    "職種別年収",
    "平均年収",
    "都道府県",
    "ランキング",
    "医師年収",
    "看護師年収",
    "保育士年収",
    "介護職員年収",
    "SE年収",
    "トラック運転手年収",
    "賃金構造基本統計調査"
  ],
  "sections": [
    {
      "key": "medical-care",
      "title": "医療・介護",
      "description": "同じ調査年の職業別平均年収です。経験年数や勤務先の構成を揃えた比較ではありません。",
      "metricGroupKeys": [
        "medical-care"
      ],
      "chartKeys": [
        "theme-occ-medical-trend"
      ]
    },
    {
      "key": "education",
      "title": "教育・保育",
      "description": "教育・保育職の平均年収を同じ年で比較します。非公表の県は0として扱いません。",
      "metricGroupKeys": [
        "education"
      ],
      "chartKeys": [
        "theme-occ-edu-trend"
      ]
    },
    {
      "key": "it-professional",
      "title": "IT・専門職",
      "description": "IT・専門職の平均年収を比較します。職種の集計範囲は指標の出典で確認できます。",
      "metricGroupKeys": [
        "it-professional"
      ],
      "chartKeys": [
        "theme-occ-it-trend"
      ]
    },
    {
      "key": "transport-construction",
      "title": "運輸・建設",
      "description": "運輸と建設の職種を分けて読みます。非公表や欠測を平均年収0とは扱いません。",
      "metricGroupKeys": [
        "transport-construction"
      ],
      "chartKeys": [
        "theme-occ-transport-trend"
      ]
    },
    {
      "key": "services",
      "title": "サービスと全職種",
      "description": "サービス職を比較します。他の職種は関連指標の索引から確認できます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-occ-service-trend"
      ]
    }
  ]
};
