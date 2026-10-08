/**
 * ブログ記事の旧 slug → 新 slug リダイレクトマップ
 *
 * slug 変更時にここに追加すると middleware.ts で 301 リダイレクトされる。
 * 形式: { "旧slug": "新slug" }
 */
export const BLOG_SLUG_REDIRECTS: Record<string, string> = {
  "aging-society-ranking": "aging-rate-akita-vs-okinawa",
  "agricultural-output-ranking": "agriculture-hokkaido-dominance",
  "alcohol-consumption-ranking": "alcohol-prefecture-map",
  "birth-rate-fertility-ranking": "fertility-rate-prefecture-gap",
  "child-physique-ranking": "child-height-regional-gap",
  "consumer-price-regional-gap-ranking": "price-index-high-low-prefecture",
  "cpi-change-rate-ranking": "cpi-change-regional-pattern",
  "fiscal-strength-ranking": "fiscal-self-reliance-gap",
  "food-expenditure-ranking": "food-spending-pattern",
  // 2026-10-08 重複記事をまとめた (BLOG-DUPLICATE-AUDIT-01)
  "fresh-udon-soba-consumption-quantity": "fresh-udon-soba-consumption-prefecture-gap",
  "household-income-ranking": "household-income-tokyo-okinawa",
  "household-spending-ranking": "household-spending-prefecture-gap",
  "household-structure-ranking": "household-solo-vs-dualincome",
  "ict-communication-cost-burden-ranking": "communication-cost-burden",
  "ict-mobile-phone-contracts-ranking": "mobile-contracts-over-population",
  "ict-post-office-density-ranking": "post-office-last-window",
  "inflation-rate-ranking": "inflation-rate-prefecture-gap",
  "local-debt-ranking": "local-government-debt-burden",
  "manufacturing-productivity-ranking": "manufacturing-productivity",
  "manufacturing-shipment-ranking": "manufacturing-aichi-dominance",
  "marriage-divorce-ranking": "marriage-divorce-okinawa",
  "nursing-care-infrastructure-ranking": "nursing-care-shortage-2040",
  "park-green-space-ranking": "park-green-space-gap",
  "per-capita-prefectural-income-ranking": "per-capita-income-gap",
  "population-decline-birthrate-ranking": "birth-death-gap-decline",
  "prefectural-income-ranking": "dual-income-reversal",
  "real-purchasing-power-ranking": "purchasing-power-adjusted",
  "real-wage-ranking": "wage-vs-living-cost",
  "safe-prefecture-features-ranking": "safe-driving-5-features",
  "savings-balance-ranking": "savings-balance-gap",
  "savings-rate-ranking": "savings-rate-gap",
  "school-nonattendance-ranking": "school-nonattendance-pattern",
  // 2026-10-08 重複記事をまとめた (BLOG-DUPLICATE-AUDIT-01)
  "school-teacher-annual-income-prefecture-gap": "school-teacher-annual-income",
  // 2026-10-08 重複記事をまとめた (BLOG-DUPLICATE-AUDIT-01)
  "soba-udon-dining-consumption-expenditure": "soba-udon-dining-consumption-expenditure-prefecture-gap",
  "sports-participation-ranking": "sports-urban-paradox",
  "sunshine-duration-ranking": "sunshine-pacific-vs-nihonkai",
  "traffic-accident-deaths-ranking": "traffic-accident-deaths-regional-risk",
  "traffic-deaths-elderly": "traffic-accident-deaths-regional-risk",
  "unemployment-rate-ranking": "unemployment-structure",
  "vacant-house-rate-ranking": "vacant-house-crisis",
  "waiting-children-ranking": "waiting-children-progress",
  "waste-recycling-rate-ranking": "recycling-rate-gap",
};
