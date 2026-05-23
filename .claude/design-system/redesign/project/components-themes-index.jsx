/* Themes index page sample data */

const THEMES_INDEX_HERO = {
  title: "テーマダッシュボード",
  description: "少子高齢化・労働・医療・観光・物価・外国人など、テーマ別に複数の指標を横断して47都道府県を比較分析できます。",
  total: 17,
  totalIndicators: 280,
  lastUpdated: "2025-04-12",
};

const THEMES_INDEX_LIST = [
  { key: "population-dynamics", name: "人口動態",     icon: "📈", color: "#1d4ed8", count: 12, top: "東京都", topLabel: "総人口", topVal: "1,401万人", featured: true, category: "人口" },
  { key: "aging-society",       name: "高齢化社会",   icon: "👴", color: "#b45309", count: 10, top: "秋田県", topLabel: "高齢化率", topVal: "39.0%", featured: true, category: "人口" },
  { key: "living-housing",      name: "住まい",       icon: "🏠", color: "#0f766e", count: 14, top: "東京都", topLabel: "住宅価格", topVal: "112万/m²", featured: false, category: "生活" },
  { key: "local-economy",       name: "地域経済",     icon: "💰", color: "#15803d", count: 19, top: "東京都", topLabel: "県内GDP", topVal: "115兆円", featured: true, category: "経済" },
  { key: "labor-wages",         name: "労働・賃金",   icon: "💼", color: "#0891b2", count: 24, top: "東京都", topLabel: "平均年収", topVal: "622万円", featured: false, category: "労働" },
  { key: "manufacturing",       name: "製造業",       icon: "🏭", color: "#4338ca", count: 15, top: "愛知県", topLabel: "製造品出荷額", topVal: "47.9兆", featured: false, category: "経済" },
  { key: "healthcare",          name: "医療・介護",   icon: "🏥", color: "#dc2626", count: 18, top: "高知県", topLabel: "医師数", topVal: "327/10万", featured: true, category: "生活" },
  { key: "safety",              name: "安全・防災",   icon: "🚓", color: "#92400e", count: 16, top: "大阪府", topLabel: "犯罪発生率", topVal: "8.2‰", featured: false, category: "生活" },
  { key: "education-culture",   name: "教育・文化",   icon: "📚", color: "#7c3aed", count: 21, top: "東京都", topLabel: "教育支出", topVal: "85万円", featured: false, category: "生活" },
  { key: "tourism",             name: "観光",         icon: "🗾", color: "#db2777", count: 14, top: "東京都", topLabel: "観光客数", topVal: "5,890万", featured: true, category: "経済" },
  { key: "consumer-prices",     name: "物価",         icon: "🛒", color: "#9333ea", count: 12, top: "東京都", topLabel: "消費者物価", topVal: "108.2", featured: false, category: "経済" },
  { key: "foreign-residents",   name: "外国人住民",   icon: "🌏", color: "#2563eb", count: 8,  top: "東京都", topLabel: "外国人人口", topVal: "63万人", featured: false, category: "人口" },
  { key: "occupation-salary",   name: "職業・給与",   icon: "💵", color: "#059669", count: 11, top: "東京都", topLabel: "情報通信業", topVal: "742万", featured: false, category: "労働" },
  { key: "real-income",         name: "実質所得",     icon: "📊", color: "#0d9488", count: 10, top: "東京都", topLabel: "実質可処分所得", topVal: "498万", featured: false, category: "経済" },
  { key: "labor-mobility",      name: "労働移動",     icon: "🚶", color: "#0e7490", count: 9,  top: "東京都", topLabel: "転入超過", topVal: "+5.1万", featured: false, category: "労働" },
  { key: "local-finance",       name: "地方財政",     icon: "🏛", color: "#7e22ce", count: 13, top: "東京都", topLabel: "歳入規模", topVal: "8.5兆", featured: false, category: "経済" },
  { key: "fishery-marine",      name: "水産業",       icon: "🐟", color: "#0284c7", count: 7,  top: "北海道", topLabel: "漁獲量", topVal: "82万t", featured: false, category: "産業" },
];

const THEMES_INDEX_GROUPS = [
  { key: "all", name: "すべて", count: 17 },
  { key: "人口", name: "人口", count: 3 },
  { key: "経済", name: "経済", count: 6 },
  { key: "生活", name: "生活", count: 4 },
  { key: "労働", name: "労働", count: 3 },
  { key: "産業", name: "産業", count: 1 },
];

Object.assign(window, { THEMES_INDEX_HERO, THEMES_INDEX_LIST, THEMES_INDEX_GROUPS });
