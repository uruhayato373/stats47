/**
 * アフィリエイト広告の「意図軸 (vertical)」= 全タクソノミー (category / theme / tag / ranking) を
 * 集約する単一ハブ。ページの意図 → vertical → 広告 で解決する。
 *
 * 正典: `.claude/rules/affiliate-ads-standards.md`。vertical の追加・写像変更はここだけで行う。
 */

/** 広告意図軸 (10 vertical)。コンテンツ分類 (category 17 / theme 20 / tag) はここへ写像する。 */
export type AffiliateVertical =
  | "labor"      // 労働・賃金・転職・キャリア
  | "housing"    // 住宅・土地・不動産・引越し
  | "population" // 人口・世帯・結婚・子育て
  | "economy"    // 家計・経済・投資・保険・物価
  | "health"     // 健康・医療・介護・フィットネス
  | "energy"     // エネルギー・水・通信
  | "travel"     // 旅行・宿泊 (OTA: 楽天トラベル/じゃらん/一休 等)
  | "furusato"   // ふるさと納税・地方財政
  | "education"  // 教育・通信教育・学習
  | "mobility";  // 交通・自動車保険・車査定・移動

/** 全 vertical の配列 (validation / iteration 用)。 */
export const AFFILIATE_VERTICALS: readonly AffiliateVertical[] = [
  "labor",
  "housing",
  "population",
  "economy",
  "health",
  "energy",
  "travel",
  "furusato",
  "education",
  "mobility",
] as const;

/**
 * @deprecated 旧名。`AffiliateVertical` を使う。型 alias として互換維持 (段階移行)。
 */
export type AffiliateCategory = AffiliateVertical;

/**
 * categoryKey (e-Stat 17 軸) → vertical。
 * ranking / category ページはこの写像で vertical を得る。
 */
export const CATEGORY_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  "laborwage":               "labor",
  "construction":            "housing",
  "landweather":             "housing",
  "population":              "population",
  "economy":                 "economy",
  "socialsecurity":          "health",
  "energy":                  "energy",
  "tourism":                 "travel",
  "administrativefinancial": "furusato",
  "educationsports":         "education",
  "safetyenvironment":       "mobility",
};

/**
 * theme スラッグ (20) → vertical。テーマページ (`/themes/*`) の広告解決に使う。
 * theme の SSOT は `packages/data-configs/src/theme-catalog/`。theme 追加時はここも更新。
 */
export const THEME_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  "aging-society":       "health",
  "consumer-prices":     "economy",
  "education-culture":   "education",
  "fishery-marine":      "economy",
  "foreign-residents":   "population",
  "healthcare":          "health",
  "labor-mobility":      "labor",
  "labor-wages":         "labor",
  "living-housing":      "housing",
  "local-economy":       "economy",
  "local-finance":       "furusato",
  "manufacturing":       "economy",
  "occupation-salary":   "labor",
  "population-dynamics": "population",
  "ports":               "mobility",
  "railway":             "mobility",
  "real-income":         "economy",
  "roads":               "mobility",
  "safety":              "mobility",
  "tourism":             "travel",
};

/** タグキー → vertical（tagKey ベース。blog frontmatter tags の写像） */
export const TAG_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  // 労働・賃金
  "wages": "labor", "labor": "labor", "employment": "labor",
  "labor-market": "labor", "minimum-wage": "labor",
  "industrial-structure": "labor",
  // 住宅・土地
  "housing": "housing", "real-estate": "housing", "relocation": "housing",
  "rent": "housing", "vacant-houses": "housing", "land-prices": "housing",
  "land-use": "housing",
  // 人口・世帯
  "population": "population", "household-structure": "population",
  "marriage": "population", "birth-rate": "population",
  "declining-birthrate": "population", "aging-population": "population",
  "childcare": "population",
  // 家計・経済・投資
  "economy": "economy", "household-finance": "economy", "gdp": "economy",
  "prices": "economy", "consumption": "economy", "income": "economy",
  "real-income": "economy", "savings": "economy", "savings-rate": "economy",
  "household-income": "economy", "household-head-income": "economy",
  "monthly-income": "economy", "income-inequality": "economy",
  "prefectural-income": "economy", "consumption-expenditure": "economy",
  "consumer-price-index": "economy",
  // 健康・医療
  "medical-care": "health", "health": "health", "long-term-care": "health",
  "welfare": "health",
  // エネルギー・水
  "energy": "energy", "water-supply": "energy", "environment": "energy",
  // 旅行・観光 (OTA)
  "tourism": "travel", "travel": "travel", "accommodation": "travel",
  "sightseeing": "travel",
  // 交通・移動・自動車 (自動車保険・車査定)
  "transportation": "mobility", "traffic-safety": "mobility",
  "traffic-accidents": "mobility", "public-safety": "mobility",
  "railway": "mobility", "roads": "mobility", "automobile": "mobility",
  // 教育・学習 (通信教育)
  "education": "education", "school": "education", "学習": "education",
  "教育": "education",
  // ふるさと納税・地方財政
  "public-finance": "furusato", "furusato-nozei": "furusato",
  "tax-revenue": "furusato", "local-government-finance": "furusato",
  "government-expenditure": "furusato",
  // 日本語 tagKey (記事 frontmatter は日本語タグをそのまま tagKey にするため)
  "賃金": "labor", "労働": "labor", "年収": "labor", "雇用": "labor",
  "労働時間": "labor", "残業": "labor", "働き方": "labor", "テレワーク": "labor",
  "エンジニア": "labor", "IT": "labor", "転職": "labor", "情報通信": "labor",
  "所得": "economy", "経済": "economy", "収入": "economy", "家計": "economy",
  "旅行": "travel", "観光": "travel", "宿泊": "travel",
  "自動車": "mobility", "交通": "mobility", "車": "mobility",
};

/**
 * 広告に付与された vertical を解決する。`vertical` を正とし、未設定なら categoryKey から写像 (後方互換)。
 * (Step B で全広告に vertical を必須化するまでの移行フォールバック)
 */
export function adVertical(ad: {
  vertical?: string | null;
  categoryKey?: string | null;
}): AffiliateVertical | undefined {
  if (ad.vertical) return ad.vertical as AffiliateVertical;
  if (ad.categoryKey) return CATEGORY_AFFILIATE_MAP[ad.categoryKey];
  return undefined;
}

/** カテゴリ別テーマカラー（Tailwind クラス: border / bg / icon） */
export const AFFILIATE_THEME: Record<
  AffiliateVertical,
  { border: string; bg: string; icon: string; emoji: string }
> = {
  labor:      { border: "border-blue-100",   bg: "bg-blue-50/50",   icon: "text-blue-400",   emoji: "💼" },
  housing:    { border: "border-orange-100", bg: "bg-orange-50/50", icon: "text-orange-400", emoji: "🏠" },
  population: { border: "border-pink-100",   bg: "bg-pink-50/50",   icon: "text-pink-400",   emoji: "💑" },
  economy:    { border: "border-green-100",  bg: "bg-green-50/50",  icon: "text-green-500",  emoji: "💰" },
  health:     { border: "border-teal-100",   bg: "bg-teal-50/50",   icon: "text-teal-500",   emoji: "💪" },
  energy:     { border: "border-cyan-100",   bg: "bg-cyan-50/50",   icon: "text-cyan-500",   emoji: "💧" },
  travel:     { border: "border-amber-100",  bg: "bg-amber-50/50",  icon: "text-amber-500",  emoji: "✈️" },
  furusato:   { border: "border-red-100",    bg: "bg-red-50/50",    icon: "text-red-400",    emoji: "🎁" },
  education:  { border: "border-indigo-100", bg: "bg-indigo-50/50", icon: "text-indigo-400", emoji: "📚" },
  mobility:   { border: "border-slate-200",  bg: "bg-slate-50/50",  icon: "text-slate-500",  emoji: "🚗" },
};
