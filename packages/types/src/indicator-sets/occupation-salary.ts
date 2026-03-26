import type { IndicatorSet } from "../indicator-set";

export const OCCUPATION_SALARY_SET: IndicatorSet = {
  key: "occupation-salary",
  title: "職業別年収",
  description:
    "都道府県別の職業別平均年収を地図とランキングで比較。医師・看護師・保育士・SE・トラック運転手など39職種の年収データを47都道府県で確認できます。賃金構造基本統計調査（厚生労働省）に基づく2010年〜2023年の推移データ。",
  category: "economy",
  usage: "theme",
  indicators: [
    // 医療・福祉
    { rankingKey: "doctor-annual-income", shortLabel: "医師", role: "primary" },
    { rankingKey: "nurse-annual-income", shortLabel: "看護師", role: "secondary" },
    { rankingKey: "pharmacist-annual-income", shortLabel: "薬剤師", role: "secondary" },
    { rankingKey: "care-worker-annual-income", shortLabel: "介護職員", role: "secondary" },
    { rankingKey: "nursery-teacher-annual-income", shortLabel: "保育士", role: "secondary" },
    { rankingKey: "midwife-annual-income", shortLabel: "助産師", role: "context" },
    { rankingKey: "practical-nurse-annual-income", shortLabel: "准看護師", role: "context" },
    { rankingKey: "dental-hygienist-annual-income", shortLabel: "歯科衛生士", role: "context" },
    { rankingKey: "dietitian-annual-income", shortLabel: "栄養士", role: "context" },
    { rankingKey: "physical-therapist-annual-income", shortLabel: "理学療法士等", role: "context" },
    // IT・専門職
    { rankingKey: "system-consultant-annual-income", shortLabel: "SIer/コンサル", role: "secondary" },
    { rankingKey: "software-engineer-annual-income", shortLabel: "SE", role: "secondary" },
    { rankingKey: "accountant-annual-income", shortLabel: "会計士・税理士", role: "context" },
    { rankingKey: "designer-annual-income", shortLabel: "デザイナー", role: "context" },
    // 教育
    { rankingKey: "school-teacher-annual-income", shortLabel: "小中学校教員", role: "secondary" },
    { rankingKey: "university-professor-annual-income", shortLabel: "大学教授", role: "context" },
    // 運輸・建設
    { rankingKey: "truck-driver-annual-income", shortLabel: "トラック運転手", role: "secondary" },
    { rankingKey: "taxi-driver-annual-income", shortLabel: "タクシー運転手", role: "secondary" },
    { rankingKey: "bus-driver-annual-income", shortLabel: "バス運転手", role: "context" },
    { rankingKey: "carpenter-annual-income", shortLabel: "大工", role: "context" },
    { rankingKey: "electrician-annual-income", shortLabel: "電気工事", role: "context" },
    { rankingKey: "architect-annual-income", shortLabel: "建築技術者", role: "context" },
    // サービス・その他
    { rankingKey: "manager-annual-income", shortLabel: "管理職", role: "secondary" },
    { rankingKey: "cook-annual-income", shortLabel: "調理従事者", role: "context" },
    { rankingKey: "barber-beautician-annual-income", shortLabel: "理容・美容師", role: "context" },
    { rankingKey: "security-guard-annual-income", shortLabel: "警備員", role: "context" },
    { rankingKey: "sales-clerk-annual-income", shortLabel: "販売店員", role: "context" },
    { rankingKey: "cleaning-worker-annual-income", shortLabel: "清掃・廃棄物", role: "context" },
    { rankingKey: "pilot-annual-income", shortLabel: "パイロット", role: "context" },
    { rankingKey: "auto-mechanic-annual-income", shortLabel: "自動車整備", role: "context" },
    { rankingKey: "dentist-annual-income", shortLabel: "歯科医師", role: "context" },
  ],
  panelTabs: [
    {
      label: "医療・福祉",
      rankingKeys: [
        "doctor-annual-income",
        "nurse-annual-income",
        "pharmacist-annual-income",
        "care-worker-annual-income",
        "nursery-teacher-annual-income",
        "midwife-annual-income",
        "practical-nurse-annual-income",
        "dental-hygienist-annual-income",
        "dietitian-annual-income",
        "physical-therapist-annual-income",
      ],
    },
    {
      label: "IT・専門",
      rankingKeys: [
        "system-consultant-annual-income",
        "software-engineer-annual-income",
        "accountant-annual-income",
        "designer-annual-income",
        "manager-annual-income",
      ],
    },
    {
      label: "教育",
      rankingKeys: [
        "school-teacher-annual-income",
        "university-professor-annual-income",
      ],
    },
    {
      label: "運輸・建設",
      rankingKeys: [
        "truck-driver-annual-income",
        "taxi-driver-annual-income",
        "bus-driver-annual-income",
        "carpenter-annual-income",
        "electrician-annual-income",
        "architect-annual-income",
        "pilot-annual-income",
        "auto-mechanic-annual-income",
      ],
    },
    {
      label: "サービス",
      rankingKeys: [
        "cook-annual-income",
        "barber-beautician-annual-income",
        "security-guard-annual-income",
        "sales-clerk-annual-income",
        "cleaning-worker-annual-income",
      ],
    },
  ],
  keywords: [
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
    "賃金構造基本統計調査",
  ],
};
