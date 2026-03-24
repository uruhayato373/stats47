export type AffiliateCategory =
  | "labor"      // 労働・賃金
  | "housing"    // 住宅・土地
  | "population" // 人口・世帯
  | "economy"    // 家計・経済
  | "health"     // 健康・医療
  | "energy"     // エネルギー・水
  | "tourism"    // 運輸・観光
  | "furusato";  // 行財政（ふるさと納税）

/** categoryKey → アフィリエイトカテゴリ */
export const CATEGORY_AFFILIATE_MAP: Record<string, AffiliateCategory> = {
  "laborwage":              "labor",
  "construction":           "housing",
  "population":             "population",
  "economy":                "economy",
  "socialsecurity":         "health",
  "energy":                 "energy",
  "tourism":                "tourism",
  "administrativefinancial": "furusato",
  "landweather":            "housing",
};

/** タグキー → アフィリエイトカテゴリ（tagKey ベース） */
export const TAG_AFFILIATE_MAP: Record<string, AffiliateCategory> = {
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
  // 運輸・観光・交通安全
  "tourism": "tourism", "transportation": "tourism",
  "traffic-safety": "tourism", "traffic-accidents": "tourism",
  "public-safety": "tourism",
  // ふるさと納税・地方財政
  "public-finance": "furusato", "furusato-nozei": "furusato",
  "tax-revenue": "furusato", "local-government-finance": "furusato",
  "government-expenditure": "furusato",
};

/** カテゴリ別テーマカラー（Tailwind クラス: border / bg / icon） */
export const AFFILIATE_THEME: Record<
  AffiliateCategory,
  { border: string; bg: string; icon: string; emoji: string }
> = {
  labor:      { border: "border-blue-100",   bg: "bg-blue-50/50",   icon: "text-blue-400",   emoji: "💼" },
  housing:    { border: "border-orange-100", bg: "bg-orange-50/50", icon: "text-orange-400", emoji: "🏠" },
  population: { border: "border-pink-100",   bg: "bg-pink-50/50",   icon: "text-pink-400",   emoji: "💑" },
  economy:    { border: "border-green-100",  bg: "bg-green-50/50",  icon: "text-green-500",  emoji: "💰" },
  health:     { border: "border-teal-100",   bg: "bg-teal-50/50",   icon: "text-teal-500",   emoji: "💪" },
  energy:     { border: "border-cyan-100",   bg: "bg-cyan-50/50",   icon: "text-cyan-500",   emoji: "💧" },
  tourism:    { border: "border-amber-100",  bg: "bg-amber-50/50",  icon: "text-amber-500",  emoji: "🚗" },
  furusato:   { border: "border-red-100",    bg: "bg-red-50/50",    icon: "text-red-400",    emoji: "🎁" },
};

