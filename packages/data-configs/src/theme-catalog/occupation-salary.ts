import type { ThemeCatalog } from "./types";

export const OCCUPATION_SALARY_CATALOG: ThemeCatalog = {
  "key": "occupation-salary",
  "title": "職業別年収",
  "description": "都道府県別の職業別平均年収をランキングとチャートで比較。医師・看護師・保育士・SE・トラック運転手など47職種の年収データを47都道府県で確認できます。賃金構造基本統計調査（厚生労働省）に基づく2010年〜2023年の推移データ。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "doctor-annual-income",
      "shortLabel": "医師",
      "role": "primary"
    },
    {
      "rankingKey": "nurse-annual-income",
      "shortLabel": "看護師",
      "role": "secondary"
    },
    {
      "rankingKey": "pharmacist-annual-income",
      "shortLabel": "薬剤師",
      "role": "secondary"
    },
    {
      "rankingKey": "care-worker-annual-income",
      "shortLabel": "介護職員",
      "role": "secondary"
    },
    {
      "rankingKey": "nursery-teacher-annual-income",
      "shortLabel": "保育士",
      "role": "secondary"
    },
    {
      "rankingKey": "midwife-annual-income",
      "shortLabel": "助産師",
      "role": "context"
    },
    {
      "rankingKey": "practical-nurse-annual-income",
      "shortLabel": "准看護師",
      "role": "context"
    },
    {
      "rankingKey": "dental-hygienist-annual-income",
      "shortLabel": "歯科衛生士",
      "role": "context"
    },
    {
      "rankingKey": "dietitian-annual-income",
      "shortLabel": "栄養士",
      "role": "context"
    },
    {
      "rankingKey": "physical-therapist-annual-income",
      "shortLabel": "理学療法士等",
      "role": "context"
    },
    {
      "rankingKey": "public-health-nurse-annual-income",
      "shortLabel": "保健師",
      "role": "context"
    },
    {
      "rankingKey": "nursing-assistant-annual-income",
      "shortLabel": "看護助手",
      "role": "context"
    },
    {
      "rankingKey": "care-manager-annual-income",
      "shortLabel": "ケアマネ",
      "role": "context"
    },
    {
      "rankingKey": "home-care-worker-annual-income",
      "shortLabel": "訪問介護",
      "role": "context"
    },
    {
      "rankingKey": "system-consultant-annual-income",
      "shortLabel": "SIer/コンサル",
      "role": "secondary"
    },
    {
      "rankingKey": "software-engineer-annual-income",
      "shortLabel": "SE",
      "role": "secondary"
    },
    {
      "rankingKey": "accountant-annual-income",
      "shortLabel": "会計士・税理士",
      "role": "context"
    },
    {
      "rankingKey": "designer-annual-income",
      "shortLabel": "デザイナー",
      "role": "context"
    },
    {
      "rankingKey": "researcher-annual-income",
      "shortLabel": "研究者",
      "role": "context"
    },
    {
      "rankingKey": "school-teacher-annual-income",
      "shortLabel": "小中学校教員",
      "role": "secondary"
    },
    {
      "rankingKey": "university-professor-annual-income",
      "shortLabel": "大学教授",
      "role": "context"
    },
    {
      "rankingKey": "associate-professor-annual-income",
      "shortLabel": "大学准教授",
      "role": "context"
    },
    {
      "rankingKey": "high-school-teacher-annual-income",
      "shortLabel": "高校教員",
      "role": "context"
    },
    {
      "rankingKey": "kindergarten-teacher-annual-income",
      "shortLabel": "幼稚園教員",
      "role": "context"
    },
    {
      "rankingKey": "truck-driver-annual-income",
      "shortLabel": "トラック運転手",
      "role": "secondary"
    },
    {
      "rankingKey": "taxi-driver-annual-income",
      "shortLabel": "タクシー運転手",
      "role": "secondary"
    },
    {
      "rankingKey": "bus-driver-annual-income",
      "shortLabel": "バス運転手",
      "role": "context"
    },
    {
      "rankingKey": "carpenter-annual-income",
      "shortLabel": "大工",
      "role": "context"
    },
    {
      "rankingKey": "electrician-annual-income",
      "shortLabel": "電気工事",
      "role": "context"
    },
    {
      "rankingKey": "architect-annual-income",
      "shortLabel": "建築技術者",
      "role": "context"
    },
    {
      "rankingKey": "manager-annual-income",
      "shortLabel": "管理職",
      "role": "secondary"
    },
    {
      "rankingKey": "cook-annual-income",
      "shortLabel": "調理従事者",
      "role": "context"
    },
    {
      "rankingKey": "barber-beautician-annual-income",
      "shortLabel": "理容・美容師",
      "role": "context"
    },
    {
      "rankingKey": "security-guard-annual-income",
      "shortLabel": "警備員",
      "role": "context"
    },
    {
      "rankingKey": "sales-clerk-annual-income",
      "shortLabel": "販売店員",
      "role": "context"
    },
    {
      "rankingKey": "cleaning-worker-annual-income",
      "shortLabel": "清掃・廃棄物",
      "role": "context"
    },
    {
      "rankingKey": "pilot-annual-income",
      "shortLabel": "パイロット",
      "role": "context"
    },
    {
      "rankingKey": "auto-mechanic-annual-income",
      "shortLabel": "自動車整備",
      "role": "context"
    },
    {
      "rankingKey": "dentist-annual-income",
      "shortLabel": "歯科医師",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-occ-medical-trend",
      "componentType": "line-chart",
      "title": "医療・福祉職の年収推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003445758",
            "cdCat02": "1121"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1133"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1361"
          }
        ],
        "labels": [
          "医師",
          "看護師",
          "介護職員"
        ],
        "seriesColors": [
          "population",
          "improve",
          "count"
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
      "section": "医療・福祉",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-occ-it-trend",
      "componentType": "line-chart",
      "title": "IT・専門職の年収推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003445758",
            "cdCat02": "1101"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1104"
          }
        ],
        "labels": [
          "SIer/コンサル",
          "SE"
        ],
        "seriesColors": [
          "population",
          "special"
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
      "section": "IT・専門",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-occ-edu-trend",
      "componentType": "line-chart",
      "title": "教育職の年収推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003445758",
            "cdCat02": "1192"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1196"
          }
        ],
        "labels": [
          "小中学校教員",
          "大学教授"
        ],
        "seriesColors": [
          "population",
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "school-teacher-annual-income",
        "university-professor-annual-income"
      ],
      "sourceName": "厚生労働省「賃金構造基本統計調査」",
      "sourceLink": "https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "教育",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-occ-transport-trend",
      "componentType": "line-chart",
      "title": "運輸・建設職の年収推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003445758",
            "cdCat02": "1614"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1612"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1661"
          }
        ],
        "labels": [
          "トラック運転手",
          "タクシー運転手",
          "大工"
        ],
        "seriesColors": [
          "population",
          "count",
          "neutral"
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
      "section": "運輸・建設",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-occ-service-trend",
      "componentType": "line-chart",
      "title": "サービス職の年収推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003445758",
            "cdCat02": "1391"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1381"
          },
          {
            "statsDataId": "0003445758",
            "cdCat02": "1453"
          }
        ],
        "labels": [
          "調理従事者",
          "理容・美容師",
          "警備員"
        ],
        "seriesColors": [
          "count",
          "special",
          "neutral"
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
      "section": "サービス",
      "sortOrder": 0
    }
  ],
  // 職種別年収は全て万円なので単軸。職種の系統ごとにカードを分けて比較しやすくする
  metricGroups: [
    {
      key: "medical-care",
      title: "医療・介護",
      rankingKeys: [
        "doctor-annual-income",
        "nurse-annual-income",
        "pharmacist-annual-income",
        "care-worker-annual-income",
      ],
      defaultCheckedKeys: [
        "doctor-annual-income",
        "nurse-annual-income",
        "care-worker-annual-income",
      ],
    },
    {
      key: "education-childcare",
      title: "教育・保育",
      rankingKeys: [
        "school-teacher-annual-income",
        "nursery-teacher-annual-income",
      ],
      defaultCheckedKeys: [
        "school-teacher-annual-income",
        "nursery-teacher-annual-income",
      ],
    },
    {
      key: "it-management",
      title: "IT・管理職",
      rankingKeys: [
        "system-consultant-annual-income",
        "software-engineer-annual-income",
        "manager-annual-income",
      ],
      defaultCheckedKeys: [
        "system-consultant-annual-income",
        "software-engineer-annual-income",
        "manager-annual-income",
      ],
    },
    {
      key: "transport",
      title: "運輸",
      rankingKeys: [
        "truck-driver-annual-income",
        "taxi-driver-annual-income",
      ],
      defaultCheckedKeys: [
        "truck-driver-annual-income",
        "taxi-driver-annual-income",
      ],
    },
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
  ]
};
