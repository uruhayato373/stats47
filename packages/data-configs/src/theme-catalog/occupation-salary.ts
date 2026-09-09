import type { ThemeCatalog } from "./types";

export const OCCUPATION_SALARY_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "職種ごとの推計年収を比較。年齢・勤続年数などの構成差を含みます。",
    "headlineRankingKeys": [
      "nurse-annual-income",
      "care-worker-annual-income",
      "software-engineer-annual-income",
      "truck-driver-annual-income"
    ],
    "comparisonRankingKeys": [
      "nurse-annual-income",
      "care-worker-annual-income",
      "software-engineer-annual-income",
      "truck-driver-annual-income",
      "doctor-annual-income",
      "pharmacist-annual-income",
      "nursery-teacher-annual-income",
      "school-teacher-annual-income"
    ],
    "mapNotes": {
      "nurse-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "care-worker-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "software-engineer-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "truck-driver-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "doctor-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "pharmacist-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "nursery-teacher-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。",
      "school-teacher-annual-income": "一般労働者・男女計。6月給与×12＋前年賞与の推計額で、手取りではありません。"
    }
  },
  "key": "occupation-salary",
  "title": "職業別年収",
  "description": "都道府県別の職業別平均年収をランキングとチャートで比較。医師・看護師・保育士・SE・トラック運転手など47職種の年収データを47都道府県で確認できます。賃金構造基本統計調査（厚生労働省）に基づく2010年〜2023年の推移データ。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "doctor-annual-income",
      "shortLabel": "医師",
      "role": "secondary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "医療職内の賃金構造を比較表と推移で補足する。"
      }
    },
    {
      "rankingKey": "nurse-annual-income",
      "shortLabel": "看護師",
      "role": "primary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生活を支える医療職の賃金水準として選ぶ。医師とは別の職種区分で比べる。"
      }
    },
    {
      "rankingKey": "pharmacist-annual-income",
      "shortLabel": "薬剤師",
      "role": "secondary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "資格職の職種差を比較表で補足する。"
      }
    },
    {
      "rankingKey": "care-worker-annual-income",
      "shortLabel": "介護職員",
      "role": "primary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "介護の担い手の賃金水準を、看護師や他分野の職種と並べて示す。"
      }
    },
    {
      "rankingKey": "nursery-teacher-annual-income",
      "shortLabel": "保育士",
      "role": "secondary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "保育の担い手の処遇を比較表で補足する。"
      }
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
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "既存の職種区分内の年収推移を示す。一般労働者・男女計の推計年収を使用し、個人の実年収とは区別する。"
      }
    },
    {
      "rankingKey": "software-engineer-annual-income",
      "shortLabel": "SE",
      "role": "primary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "医療・運輸に偏らない専門技術職の比較軸として選ぶ。"
      }
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
      "role": "secondary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "教育分野の処遇を比較表と職種内推移で補足する。"
      }
    },
    {
      "rankingKey": "university-professor-annual-income",
      "shortLabel": "大学教授",
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "既存の職種区分内の年収推移を示す。一般労働者・男女計の推計年収を使用し、個人の実年収とは区別する。"
      }
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
      "role": "primary",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生活物流を支える営業用大型貨物運転者を代表として選ぶ。運転職全体の平均とはしない。"
      }
    },
    {
      "rankingKey": "taxi-driver-annual-income",
      "shortLabel": "タクシー運転手",
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "既存の職種区分内の年収推移を示す。一般労働者・男女計の推計年収を使用し、個人の実年収とは区別する。"
      }
    },
    {
      "rankingKey": "bus-driver-annual-income",
      "shortLabel": "バス運転手",
      "role": "context"
    },
    {
      "rankingKey": "carpenter-annual-income",
      "shortLabel": "大工",
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「賃金構造基本統計調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "既存の職種区分内の年収推移を示す。一般労働者・男女計の推計年収を使用し、個人の実年収とは区別する。"
      }
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
      "role": "context"
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
  "charts": [],
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
  evidenceTopics: [
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
      "relatedChartKeys": [],
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
      "relatedChartKeys": [],
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
  ]
};
