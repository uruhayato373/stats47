/**
 * 自明な相関ペアの除外リスト。
 * 物理法則・同一指標・部分⊂全体・施設規模連動など、
 * 相関が高いことに分析上の発見がないペアを定義する。
 *
 * 3層の除外メカニズム:
 * 1. EXCLUDED_PAIRS: 特定ペアの除外（順序不問）
 * 2. EXCLUDED_GROUPS: グループ内全ペアの自動除外
 * 3. EXCLUDED_CORRELATION_KEYS: 個別指標の相関ランキング除外
 *    （人口比例の絶対数など、どの指標と組み合わせても自明な相関になるもの）
 */

// ---------------------------------------------------------------------------
// 1. 特定ペアの除外
// ---------------------------------------------------------------------------

/** ranking_key ペアの明示的な除外リスト（順序不問で照合） */
const EXCLUDED_PAIRS: [string, string][] = [
  // --- 物理法則 ---
  ["ssdse-f-elevation", "ssdse-f-pressure-local"],

  // --- 同一指標の別ラベル ---
  ["public-nursery-ratio", "public-nursery-student-ratio"],
  ["suicide-rate-per-100k", "suicides-per-100k"],
  [
    "private-auto-insurance-penetration-rate-object",
    "private-auto-insurance-penetration-rate-person",
  ],

  // --- 補数関係 ---
  ["employed-people-ratio", "unemployment-rate"],

  // --- 部分⊂全体（面積） ---
  [
    "cultivated-area",
    "total-area-excluding-northern-territories-and-takeshima",
  ],
  [
    "habitable-area",
    "total-area-excluding-northern-territories-and-takeshima",
  ],
  [
    "cultivated-area",
    "habitable-area",
  ],

  // --- 部分⊂全体（製造業） ---
  ["manufacturing-industry-added-value", "manufacturing-shipment-amount"],

  // --- 部分⊂全体（投資） ---
  ["total-administrative-investment", "total-general-project-investment"],

  // --- 部分⊂全体（犯罪） ---
  ["criminal-arrest-rate", "theft-criminal-arrest-rate"],
  [
    "penal-code-offenses-recognized-per-1000",
    "theft-offenses-recognized-per-1000",
  ],

  // --- 部分⊂全体（電話） ---
  [
    "residential-telephone-subscription-count-per-1000",
    "telephone-subscription-count-per-1000",
  ],

  // --- 貯蓄の同一現象 ---
  [
    "avg-savings-rate-worker-households",
    "net-increase-rate-deposits-worker-households",
  ],

  // --- 同一教育費の別集計 ---
  [
    "junior-high-school-education-cost-per-student",
    "per-student-public-junior-high-school-expenditure-pref-municipal",
  ],
  [
    "elementary-school-education-cost-per-student",
    "per-child-public-elementary-school-expenditure-pref-municipal",
  ],

  // --- 部分⊂全体（歳出） ---
  [
    "per-capita-social-welfare-expenditure-pref-municipal",
    "per-capita-welfare-expenditure-pref-municipal",
  ],

  // --- 部分⊂全体（犯罪・少年） ---
  [
    "juvenile-criminal-arrest-person-per-population",
    "juvenile-theft-offender-arrests-per-1000-14-19",
  ],

  // --- 部分⊂全体（小売） ---
  ["food-retail-store-count-per-1000", "retail-store-count-per-1000"],

  // --- 部分⊂全体（公園面積） ---
  ["national-park-area", "nature-park-area"],

  // --- 施設規模連動（公立一般病院） ---
  ["public-general-hospital-bed-ratio", "public-general-hospital-ratio"],

  // --- 施設規模連動（公立高等学校） ---
  ["public-high-school-ratio", "public-high-school-student-ratio"],

  // --- 構成要素（人口増減） ---
  ["natural-increase-rate", "population-growth-rate"],

  // --- 構造的逆相関（世帯人員/単独世帯） ---
  ["average-persons-per-general-household", "single-person-household-ratio"],

  // --- 部分⊂全体（歳入/交付金） ---
  [
    "total-revenue-prefecture",
    "traffic-safety-special-grant-prefecture",
  ],

  // --- 施設規模連動（製造業） ---
  ["manufacturing-employees", "manufacturing-establishments"],

  // --- 同一保険の別測定 ---
  [
    "private-life-insurance-contract-amount-per-household",
    "private-life-insurance-contracts-per-1000",
  ],

  // --- 同一現象（転入/転出率） ---
  ["moving-in-rate", "moving-out-rate"],

  // --- 同一現象（就職率） ---
  ["employment-rate", "part-time-employment-rate-regular"],

  // --- 同一区分（事業所従業者割合） ---
  [
    "employee-ratio-100-299-employee-establishments-private",
    "establishment-ratio-100-299-employees-private",
  ],
  [
    "employee-ratio-1-4-employee-establishments-private",
    "establishment-ratio-1-4-employees-private",
  ],

  // --- 同一現象（就業異動/転職） ---
  ["employment-mobility-rate", "job-change-rate"],

  // --- 施設規模連動（ホテル） ---
  ["number-of-hotel-facilities", "number-of-hotel-rooms"],

  // --- 公立学校割合/生徒比率（同一区分） ---
  ["public-kindergarten-ratio", "public-kindergarten-student-ratio"],

  // --- 補数関係（高校卒業後進路） ---
  ["high-school-advancement-rate", "high-school-graduates-job-ratio"],

  // --- 施設規模連動（歯科） ---
  ["dental-clinic-count-per-100k", "dentists-in-medical-facilities-per-100k"],

  // --- 同一施策（学校屋内運動場設置率） ---
  [
    "public-elementary-school-gym-installation-rate",
    "public-junior-high-school-gym-installation-rate",
  ],

  // --- 同一現象（湿度） ---
  ["average-relative-humidity", "ssdse-f-humidity"],

  // --- 気象連動（降水日数と日照率） ---
  ["annual-precipitation-days", "ssdse-f-sunlight-rate-over-40"],

  // --- 補数関係（2次活動/3次活動時間） ---
  [
    "secondary-activity-avg-time-employed-female",
    "tertiary-activity-avg-time-employed-female",
  ],

  // --- 教育費連動（小中学校） ---
  [
    "elementary-school-education-cost-per-student",
    "junior-high-school-education-cost-per-student",
  ],
];

// ---------------------------------------------------------------------------
// 2. グループ内全ペア除外
// ---------------------------------------------------------------------------

/**
 * グループ内の全ペアを自動的に除外する。
 * 同一現象の指標群（気象、生活保護、施設規模など）はグループで管理し、
 * グループ内の任意の2指標の組み合わせが除外対象になる。
 */
const EXCLUDED_GROUPS: string[][] = [
  // --- 同一気象現象（気温・蒸気圧） ---
  [
    "average-temperature",
    "ssdse-f-avg-temp",
    "ssdse-f-min-temp-avg",
    "ssdse-f-max-temp-avg",
    "lowest-temperature",
    "ssdse-f-vapor-pressure",
  ],

  // --- 同一気象現象（日照） ---
  [
    "ssdse-f-sunlight-hours",
    "ssdse-f-sunlight-rate-over-40",
    "ssdse-f-sunlight-under-01",
    "annual-sunshine-duration",
  ],

  // --- 同一気象現象（降雪） ---
  ["ssdse-f-max-snow-depth", "ssdse-f-snowfall-total", "ssdse-f-snow-days"],

  // --- 同一気象現象（降水量） ---
  ["annual-precipitation", "ssdse-f-precipitation"],

  // --- SSDSE重複（ボランティア） ---
  [
    "ssdse-d-me00",
    "volunteer-activity-annual-participation-rate-10plus",
    "volunteer-activity-annual-participation-rate-15plus",
  ],

  // --- SSDSE重複（旅行） ---
  [
    "overseas-travel-annual-participation-rate-10plus",
    "ssdse-d-mf022",
    "ssdse-d-mf021",
    "ssdse-d-mf02",
    "ssdse-d-mf0211",
    "travel-leisure-annual-participation-rate-10plus",
  ],

  // --- SSDSE重複（スポーツ） ---
  ["sports-annual-participation-rate-10plus", "ssdse-d-mc20"],

  // --- 交通事故（部分⊂全体） ---
  [
    "traffic-accident-casualties-per-population",
    "traffic-accident-injuries-per-100k",
    "traffic-accident-count-per-population",
  ],

  // --- 生活保護（被保護世帯/人員と各扶助人員・高齢者・施設・従事者） ---
  [
    "persons-on-public-assistance-per-1000",
    "households-on-public-assistance-per-1000",
    "public-assistance-housing-beneficiaries-per-1000",
    "public-assistance-medical-beneficiaries-per-1000",
    "public-assistance-nursing-beneficiaries-per-1000",
    "public-assistance-education-beneficiaries-per-1000",
    "elderly-on-public-assistance-per-1000-65plus",
    "public-assistance-facility-capacity-per-1000",
    "public-assistance-facility-residents-per-1000",
    "welfare-facility-staff-per-1000-on-assistance",
    "welfare-facilities-count-per-100k-on-assistance",
  ],

  // --- 施設規模連動（身体障害者更生援護施設） ---
  [
    "physical-disability-rehabilitation-facility-capacity-per-100k",
    "physical-disability-rehabilitation-facility-residents-per-100k",
    "physical-disability-rehabilitation-facility-staff-per-100k",
    "physical-disability-rehabilitation-facility-count-per-1m",
  ],

  // --- 施設規模連動（知的障害者援護施設） ---
  [
    "intellectual-disability-support-facility-capacity-per-100k",
    "intellectual-disability-support-facility-residents-per-100k",
    "intellectual-disability-support-facility-staff-per-100k",
    "intellectual-disability-support-facility-count-per-1m",
  ],

  // --- 施設規模連動（老人ホーム＋有料老人ホーム 定員/在所者/数/従事者） ---
  [
    "nursing-home-count-per-100k-65plus",
    "nursing-home-capacity-per-1000-65plus",
    "nursing-home-residents-per-1000-65plus",
    "nursing-home-staff-per-100k-65plus",
    "paid-nursing-home-count-per-100k-65plus",
    "paid-nursing-home-capacity-per-1000-65plus",
    "paid-nursing-home-residents-per-1000-65plus",
  ],

  // --- 公園密度（部分⊂全体） ---
  [
    "block-park-count-per-100km2",
    "neighborhood-park-count-per-100km2",
    "urban-park-count-per-100km2",
  ],

  // --- 離別者割合（性別・年代別） ---
  [
    "divorced-ratio-female-40-49",
    "divorced-ratio-female-50-59",
    "divorced-ratio-male-40-49",
    "divorced-ratio-male-50-59",
  ],

  // --- 持ち家住宅（別測定） ---
  [
    "floor-area-per-dwelling-owner",
    "rooms-per-dwelling-owner",
    "tatami-per-dwelling-owner",
    "tatami-per-person-owner",
    "rooms-per-dwelling",
  ],

  // --- 借家住宅（別測定） ---
  [
    "floor-area-per-dwelling-rented",
    "rooms-per-dwelling-rented",
    "tatami-per-dwelling-rented",
  ],

  // --- 死亡率・高齢化・平均余命（構造的連動） ---
  [
    "crude-death-rate",
    "crude-death-rate-male",
    "crude-death-rate-female",
    "deaths-lifestyle-diseases-per-100k",
    "deaths-malignant-neoplasms-per-100k",
    "deaths-heart-disease-excl-hypertensive-per-100k",
    "deaths-cerebrovascular-disease-per-100k",
    "old-population-index",
    "dependent-population-index",
    "aging-index",
  ],

  // --- 標準化死亡率と平均余命（逆相関の同一現象） ---
  [
    "standardized-mortality-japanese",
    "standardized-mortality-rate-per-1000",
    "life-expectancy-0-male",
    "average-life-expectancy-male",
  ],

  // --- 面積（部分⊂全体） ---
  [
    "cultivated-area",
    "cultivated-land-area-per-household",
    "habitable-area",
    "total-area-excluding-northern-territories-and-takeshima",
    "forest-area",
    "woodland-area",
  ],

  // --- 密度連動（学校/消防署/郵便局/人口密度） ---
  [
    "elementary-school-count-per-100km2-habitable",
    "junior-high-school-count-per-100km2-habitable",
    "high-school-count-per-100km2-habitable",
    "fire-department-count-per-100-km2",
    "post-office-count-per-100km2",
    "population-density-per-km2-total-area",
  ],

  // --- 医療施設密度（人口密度連動） ---
  [
    "general-clinic-count-per-100km2",
    "general-hospital-count-per-100km2",
    "dental-clinic-count-per-100km2",
    "pharmacy-count-per-100km2",
    "pharmaceutical-sales-count-per-100km2",
  ],

  // --- 事業所規模区分（従業者割合と事業所割合の連動） ---
  [
    "employee-ratio-300plus-employee-establishments-private",
    "establishment-ratio-300plus-employees-private",
    "employee-ratio-100-299-employee-establishments-private",
    "establishment-ratio-100-299-employees-private",
    "employee-ratio-5-9-employee-establishments-private",
    "employee-ratio-1-4-employee-establishments-private",
    "establishment-ratio-1-4-employees-private",
  ],

  // --- 施設規模連動（一般病院：病床/在院患者/看護師/数/在院日数/年間新入院） ---
  [
    "general-hospital-bed-count-per-100k",
    "avg-daily-inpatients-general-hospital-per-100k",
    "nurses-in-medical-facilities-per-100k",
    "general-hospital-count-per-100k",
    "general-hospital-avg-length-of-stay",
    "annual-new-inpatients-general-hospital-per-100k",
  ],

  // --- 住宅形態（持ち家/借家/一戸建/共同住宅は補数関係、居住室数も連動） ---
  [
    "detached-house-ratio",
    "apartment-ratio",
    "owner-occupied-housing-ratio",
    "rented-housing-ratio",
    "new-owner-occupied-housing-ratio",
    "private-rented-housing-ratio",
    "rooms-per-dwelling",
    "household-ratio-above-minimum-housing-area",
  ],

  // --- 小中高校の児童生徒数（教員比・1校あたり） ---
  [
    "elementary-school-children-1-per",
    "elementary-school-students-per-teacher",
    "junior-high-school-students-per-teacher",
    "middle-school-students-1-per",
    "high-school-students-per-teacher",
  ],

  // --- 経済成長率（同一年次の別集計） ---
  [
    "gdp-growth-rate-pref-h23",
    "gross-prefectural-income-growth-rate-nominal-h23",
    "prefectural-income-growth-rate-h23",
  ],
  [
    "gdp-growth-rate-pref-h17",
    "gross-prefectural-income-growth-rate-nominal-h17",
    "prefectural-income-growth-rate-h17",
  ],

  // --- 教育普及度（幼稚園/保育所は補数関係） ---
  [
    "kindergarten-education-diffusion-rate",
    "nursery-education-diffusion-rate",
  ],

  // --- 消防（人員/車両連動） ---
  [
    "fire-department-pump-car-count-per-100-thousand-people",
    "fire-related-personnel-count-per-100k",
  ],

  // --- 小中高校数と救急自動車数（人口あたり公共サービス密度） ---
  [
    "elementary-school-count-per-100k-6-11",
    "junior-high-school-count-per-100k-12-14",
    "high-school-count-per-100k-15-17",
    "fire-department-emergency-car-count-per-100k",
  ],

  // --- 事業所数と従業者数（部分⊂全体的） ---
  [
    "number-of-establishments-transport-post",
    "tertiary-industry-employees-per-establishment",
  ],

  // --- 施設規模連動（精神科病院） ---
  [
    "avg-daily-inpatients-psychiatric-hospital-per-100k",
    "psychiatric-hospital-count-per-100k",
    "psychiatric-bed-count-per-100k",
    "annual-new-inpatients-psychiatric-hospital-per-100k",
  ],
];

// ---------------------------------------------------------------------------
// 3. 相関ランキングから除外する個別指標
//    人口比例の絶対数 — どの指標と組み合わせても「人口が多い県は多い」
//    という自明な結果になるため、相関ランキングからは除外する。
//    ランキングページ自体では引き続き表示される（isActive=true は維持）。
// ---------------------------------------------------------------------------

export const EXCLUDED_CORRELATION_KEYS: string[] = [
  // --- 人口規模 ---
  "total-population",
  "japanese-population",
  "general-households",
  "households",
  "day-time-population",
  "densely-inhabited-district-population",
  "densely-populated-area",

  // --- 転入・転出（絶対数） ---
  "movers-in",
  "movers-out",
  "japanese-movers-in",
  "japanese-movers-in-male",
  "japanese-movers-in-female",
  "japanese-movers-out",
  "japanese-movers-out-male",
  "japanese-movers-out-female",
  "social-increase",
  "japanese-entries",

  // --- 人口動態（絶対数） ---
  "births",
  "marriages",
  "divorces",
  "death-count",
  "stillbirths",
  "stillbirths-after-22-weeks",
  "infant-deaths",
  "neonatal-deaths",
  "early-neonatal-deaths",
  "suicide-count",
  "suicide-count-65plus",
  "death-accident",
  "single-father-households",
  "single-mother-households",

  // --- 医療従事者（絶対数） ---
  "nurse-count",
  "midwife-count",
  "pharmacist-count",
  "public-health-nurse-count",

  // --- 医療施設・患者（絶対数） ---
  "pharmacy-count",
  "new-inpatients",
  "discharged-patients",
  "total-outpatients",
  "total-inpatients",

  // --- 経済（絶対額） ---
  "total-production-in-the-prefecture",
  "sales-amount-private",
  "electricity-demand",
  "gasoline-sales-volume",
  "postal-savings-balance",
  "domestic-bank-deposit-balance",
  "taxpayer-count-income",
  "male-parttime-workers",

  // --- 建設・交通（絶対数） ---
  "construction-industry-count",
  "number-of-constructed-buildings",
  "prime-contractor-completed-construction",
  "subcontractor-completed-construction",
  "truck-operators",
  "jr-passenger-transport",
  "private-railway-passenger-transport",
  "air-cargo-transport",
  "air-passenger-transport",
  "mail-items-handled",

  // --- 行政（絶対数） ---
  "municipal-general-administration-staff",
  "education-department-staff",
  "fire-department-employees",
  "police-department-staff",
  "prefectural-assembly-members",
  "city-ward-assembly-members",
  "total-expenditure-prefecture",

  // --- 外国人（絶対数） ---
  "foreign-resident-count",
  "foreign-resident-count-china",
  "foreign-resident-count-usa",
  "resident-foreigner-population",

  // --- その他（絶対数） ---
  "general-project-investment-housing",
  "number-of-establishments-establishment-corporate-statistics",
];

// ---------------------------------------------------------------------------
// ルックアップ構造
// ---------------------------------------------------------------------------

/** ranking_key ペアをソート済みキーに変換 */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

/** グループから全ペアを生成 */
function groupToPairs(group: string[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      keys.push(pairKey(group[i], group[j]));
    }
  }
  return keys;
}

/** O(1) ルックアップ用 Set（ペア除外） */
const excludedPairSet = new Set([
  ...EXCLUDED_PAIRS.map(([a, b]) => pairKey(a, b)),
  ...EXCLUDED_GROUPS.flatMap(groupToPairs),
]);

/** O(1) ルックアップ用 Set（個別指標除外） */
const excludedKeySet = new Set(EXCLUDED_CORRELATION_KEYS);

/**
 * 指定した ranking_key ペアが自明な相関として除外対象かを判定する。
 * 順序不問（X/Y を入れ替えても同じ結果）。
 */
export function isExcludedCorrelationPair(
  rankingKeyX: string,
  rankingKeyY: string
): boolean {
  return excludedPairSet.has(pairKey(rankingKeyX, rankingKeyY));
}

/**
 * 指定した ranking_key が相関ランキングから除外対象かを判定する。
 * 人口比例の絶対数など、どの指標と組み合わせても自明な結果になる指標。
 */
export function isExcludedCorrelationKey(rankingKey: string): boolean {
  return excludedKeySet.has(rankingKey);
}
