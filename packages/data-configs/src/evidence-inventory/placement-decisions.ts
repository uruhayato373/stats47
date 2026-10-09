/**
 * 参考文献由来の指標を、ある展開先に「載せない」と決めた記録 (2026-10-09 新設)。
 *
 * 管理画面の参考文献の展開状況 (`apps/admin/lib/content-operations/reference.ts`) が読み、
 * rejected は「対象外 (採用を見送った)」、blocked は「停止中」として数える。記録が無いと、
 * 判断済みの指標がいつまでも「着手できる」に残り、未着手の件数が実態とずれる。
 *
 * - planned: 載せる企画を立てた (target に展開先の slug。テーマの企画表は 2026-10-10 に backlog の表からここへ移した)
 * - rejected: 展開先の読み手にとって載せる価値が無いと判断した (理由を必ず書く)
 * - blocked: 載せたいが、生成器や設定の不備・判断待ちで今は載せられない (解消したら行を消して載せる)
 *
 * 判断は展開先の担当 (県データブック = area-databook-designer、/japan = japan-catalog.ts の採用条件) が行い、
 * 判断の出どころは decidedBy に書く。採用したものはここに書かない (テンプレート・カタログ側が正本)。
 */
export type ReferencePlacementChannel =
  | "theme"
  | "area"
  | "japan"
  | "blog"
  | "note"
  | "youtube"
  | "instagram"
  | "x";

export interface ReferencePlacementDecision {
  channel: ReferencePlacementChannel;
  metricKey: string;
  status: "planned" | "rejected" | "blocked";
  reason: string;
  /** planned / blocked の企画で、載せる先 (テーマなら themeSlug) */
  target?: string;
  /** 管理画面の企画一覧に出す見出し (省略時は指標の key) */
  title?: string;
  decidedAt: string;
  decidedBy: string;
}

const THEME_BY = "theme-designer (2026-09-14 判定) と参考文献の展開判断";
const AREA_BY = "area-databook-designer + 反証レビュー (workflow wf_d6395a0b-9e0)";
const JAPAN_BY = "verify-japan-candidates.ts の値レベル検証 + 反証レビュー (workflow wf_d6395a0b-9e0)";
const KAKEI_BLOCKED =
  "家計調査の品目で全国値はあるが、全国時系列の生成器 (generate-japan-series.ts の official モード) が kakei-chousa に未対応";

export const REFERENCE_PLACEMENT_DECISIONS: readonly ReferencePlacementDecision[] = [
  { channel: "theme", metricKey: "projected-population-2020", status: "blocked", target: "population-dynamics", title: "将来推計人口", reason: "将来人口と現在の人口動態を同じ時間軸で比較する企画。公開中の指標が無いため停止", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "gross-prefectural-product-expenditure-nominal-h27", status: "blocked", target: "local-economy", title: "県内総生産", reason: "地域経済の規模と産業・雇用構造を同じ画面で比較する企画。公開中の指標が無いため停止", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "students-requiring-japanese-instruction", status: "blocked", target: "education-culture", title: "日本語指導が必要な児童生徒数", reason: "国籍と支援ニーズを分け、人数・児童生徒比・学校側の受入体制を重ねて読む企画。公開中の指標が無いため停止", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "general-households", status: "rejected", reason: "人口動態は増減の仕組みを扱うテーマで無関係。世帯構造は別テーマ向き", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "area-ratio-of-total", status: "rejected", reason: "面積割合は気候 (気象) と直接関係しない地理指標", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "number-of-establishments-manufacturing", status: "rejected", reason: "登録済みの manufacturing-establishments と同じ統計表の重複で、年度が古い", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "average-life-expectancy-male", status: "rejected", reason: "subtitle に年齢が無く、値 63 年が 0 歳時点と矛盾する。指標の修正が先", decidedAt: "2026-09-14", decidedBy: THEME_BY },
  { channel: "theme", metricKey: "child-abuse-consultation-cases", status: "blocked", title: "児童虐待相談対応件数", reason: "既存 55 テーマに合うものが無い。児童福祉・子どもの安全のテーマを新設するかの判断待ち (THEME-CHILD-WELFARE-01)", decidedAt: "2026-10-08", decidedBy: THEME_BY },
  { channel: "area", metricKey: "average-life-expectancy-male", status: "rejected", reason: "平均寿命の男女対と重複し、基準は2020年の年齢別余命で古い", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "average-life-expectancy-female-20", status: "rejected", reason: "平均寿命の男女対と重複し、2020年の年齢別余命で古い", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "average-life-expectancy-female-65", status: "rejected", reason: "平均寿命の男女対と重複し、2020年の年齢別余命で古い", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "area-ratio-of-total", status: "rejected", reason: "総面積の順位と同じ情報で、全国比は読み手の問いを増やさない", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "municipality-count", status: "rejected", reason: "行政区画の数で県の優劣を読む指標でなく、県の特徴カードに誤って出る恐れがある", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "emergency-hospital-general-clinic-count-per-100k", status: "rejected", reason: "救急告示病院と一般診療所の合算で、一般診療所数と重複し意味が混ざる", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "suicides-per-100k", status: "rejected", reason: "採用済みの suicide-rate-per-100k と同じ主題で重複", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "breast-cancer-asr75-mortality-female", status: "rejected", reason: "特定の部位・性別の死亡率で、県ページの共通テンプレに対し範囲が狭い", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "infant-deaths", status: "rejected", reason: "総数で県の人口規模に左右される。乳児死亡率を採用済み", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "households-on-public-assistance", status: "rejected", reason: "総数。千世帯当たりを household セクションで採用済み", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "disposable-income-after-rent", status: "rejected", reason: "所得と家賃で世帯の範囲が異なる参考計算で、指標自身が実際の手残りを示さないと注記している", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "real-disposable-income", status: "rejected", reason: "県庁所在市等の勤労者世帯の所得を物価指数で割った参考値で、指標自身が購買力を直接示さないと注記している", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "current-life-insurance-balance-ratio-multi-person-households", status: "rejected", reason: "貯蓄内訳の構成比で、2019年と古く、他の2件と合わせて100%に近づく冗長な構成", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "current-securities-balance-ratio-multi-person-households", status: "rejected", reason: "貯蓄内訳の構成比で、2019年と古く、冗長", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "current-deposit-balance-ratio-multi-person-households", status: "rejected", reason: "貯蓄内訳の構成比で、2019年と古く、冗長", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "securities-balance", status: "rejected", reason: "最新が2014年で古く、貯蓄現在高と主題が重なる", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "natural-increase-rate", status: "rejected", reason: "同じ節にある出生率と死亡率の差とほぼ同じ値になる (47 県で差は最大 0.36‰。反証レビュー 2026-10-09)", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "infant-mortality-rate-per-1000-births", status: "rejected", reason: "出生数が少なく順位が年ごとにほぼ偶然で入れ替わる (2023↔2018 の順位相関 0.19。反証レビュー 2026-10-09)", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "area", metricKey: "private-rental-housing-rent-per-3-3m2", status: "rejected", reason: "県庁所在市等の調査値で、年次が 2017 から 2024 へ飛び、物価地域差指数 (住居) と同じ事実を読む (反証レビュー 2026-10-09)", decidedAt: "2026-10-09", decidedBy: AREA_BY },
  { channel: "japan", metricKey: "number-of-establishments-manufacturing", status: "rejected", reason: "全国値は 2009・2014 の 2 年だけで、manufacturing-establishments (2024 年まで 49 年) と意味が重なる", decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "day-time-population", status: "rejected", reason: "日本全体では昼間人口が総人口と同じ値になり、全国時系列として意味を持たない (反証レビュー 2026-10-09)", decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "total-fertility-rate", status: "blocked", reason: "config の単位「人」と e-Stat の単位「‐」が合わず、生成器が受け付けない (単位の修正が先)", decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "agricultural-output", status: "blocked", reason: "外部取得の指標で、全国時系列の生成器 (official モード) が e-Stat 以外に未対応", decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "engel-coefficient", status: "blocked", reason: "計算型の比率で、全国時系列の生成器が未対応 (県の値の合算では作れない)", decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "air-conditioner-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "air-conditioner-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "gasoline-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "gasoline-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "camera-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "cable-tv-fee-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "coffee-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "contact-lens-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "heater-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "tobacco-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "television-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "television-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "personal-computer-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "handbag-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "handbag-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "massage-fee-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "rental-car-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "medical-fee-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "supplement-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "recorded-media-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "cold-medicine-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "eyeglasses-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "language-lesson-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "high-school-tutoring-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "public-university-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "domestic-student-remittance-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "sugar-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "sugar-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "umbrella-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "umbrella-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "childrens-clothing-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "private-university-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "dental-fee-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "car-purchase-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "car-purchase-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "consumption-expenditure-total", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "food-expenditure-total", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "cooking-appliance-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "other-womens-underwear-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "mens-coat-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "mens-sweater-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "mens-underwear-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "mens-clothing-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "washing-machine-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "vacuum-cleaner-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "refrigerator-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "refrigerator-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "microwave-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "womens-coat-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "womens-coat-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "womens-sweater-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "womens-sweater-consumption-quantity", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "womens-clothing-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "rice-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
  { channel: "japan", metricKey: "wristwatch-consumption-expenditure", status: "blocked", reason: KAKEI_BLOCKED, decidedAt: "2026-10-09", decidedBy: JAPAN_BY },
];
