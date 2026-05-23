/* Search page sample data + helpers */

const SEARCH_QUERY = "東京 人口";

const SEARCH_RESULTS = [
  {
    type: "ranking", id: "r1",
    title: "総人口", subtitle: "全国",
    latestYear: "2024", demographicAttr: null, normalizationBasis: null,
    category: "人口・世帯",
    snippet: "<mark>東京都</mark>は<mark>人口</mark>1,401万人で全国1位。神奈川県・大阪府が続きます。",
    top1: "東京都", top1Val: "1,401万",
  },
  {
    type: "ranking", id: "r2",
    title: "人口密度", subtitle: null,
    latestYear: "2024", normalizationBasis: "人口・面積",
    category: "人口・世帯",
    snippet: "<mark>東京都</mark>の<mark>人口</mark>密度は6,398人/km²で、全国平均の約19倍。",
    top1: "東京都", top1Val: "6,398",
  },
  {
    type: "blog", id: "b1",
    title: "東京都の人口推移と一極集中の現状",
    publishedAt: "2025-04-12",
    category: "人口・世帯",
    description: "2024年データで読み解く、47都道府県の<mark>人口</mark>動態と地方の人口減少。<mark>東京</mark>都の人口は約1,401万人に達し、全国合計の約11.3%を占めている。",
    tags: ["人口", "東京都", "都市集中"],
    readMinutes: 7,
  },
  {
    type: "ranking", id: "r3",
    title: "人口増減率", subtitle: null,
    latestYear: "2024", normalizationBasis: null,
    category: "人口・世帯",
    snippet: "<mark>東京</mark>都は+0.07%。<mark>人口</mark>増減率では沖縄県(+2.7%)に次ぎ高水準。",
    top1: "沖縄県", top1Val: "+2.7%",
  },
  {
    type: "blog", id: "b2",
    title: "東京一極集中はなぜ進むのか — 人口・経済・産業の3視点",
    publishedAt: "2025-03-15",
    category: "経済",
    description: "<mark>東京</mark>への<mark>人口</mark>集中の構造的要因を、人口・経済・産業の3つの視点から分析。",
    tags: ["東京都", "都市集中", "経済"],
    readMinutes: 9,
  },
  {
    type: "ranking", id: "r4",
    title: "外国人人口", subtitle: null,
    latestYear: "2023", normalizationBasis: null,
    category: "人口・世帯",
    snippet: "<mark>東京</mark>都の外国人<mark>人口</mark>は63万人で全国1位。前年比+1.4%で増加傾向。",
    top1: "東京都", top1Val: "63万",
  },
];

const POPULAR_SEARCHES = [
  "東京 人口", "高齢化率", "出生率 ランキング", "ふるさと納税 返礼品",
  "人口密度", "平均年収", "東京一極集中", "秋田県 人口減少",
  "都道府県 GDP", "観光客数",
];

const SEARCH_TRENDING = [
  { q: "東京 人口", hits: 1240, trend: "up" },
  { q: "高齢化率 47都道府県", hits: 980, trend: "up" },
  { q: "ふるさと納税 ランキング", hits: 720, trend: "flat" },
  { q: "出生率 推移", hits: 560, trend: "up" },
  { q: "外国人 人口", hits: 410, trend: "down" },
];

const SEARCH_CATEGORIES = [
  { key: "population-households", name: "人口・世帯", count: 28, color: "#1d4ed8", icon: "👥" },
  { key: "labor-wages",           name: "労働・賃金", count: 24, color: "#0891b2", icon: "💼" },
  { key: "education-culture",     name: "教育・文化", count: 21, color: "#7c3aed", icon: "📚" },
  { key: "healthcare",            name: "医療・介護", count: 18, color: "#dc2626", icon: "🏥" },
  { key: "safety",                name: "安全・防災", count: 16, color: "#b45309", icon: "🚓" },
  { key: "local-economy",         name: "地域経済", count: 19, color: "#15803d", icon: "💰" },
  { key: "tourism",               name: "観光", count: 14, color: "#db2777", icon: "🗾" },
  { key: "consumer-prices",       name: "物価", count: 12, color: "#9333ea", icon: "🛒" },
];

const SEARCH_TAGS = [
  "人口", "東京都", "高齢化", "出生率", "観光", "経済", "労働",
  "医療", "教育", "都市集中", "地方創生", "ふるさと納税",
];

// Highlight HTML — sanitized
function Highlighted({ html }) {
  return (
    <span dangerouslySetInnerHTML={{ __html: html
      .replace(/<mark>/g, '<mark style="background:#fef08a;color:inherit;padding:1px 2px;border-radius:2px">')
    }} />
  );
}

Object.assign(window, {
  SEARCH_QUERY, SEARCH_RESULTS, POPULAR_SEARCHES, SEARCH_TRENDING,
  SEARCH_CATEGORIES, SEARCH_TAGS, Highlighted,
});
