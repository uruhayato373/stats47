/* Survey page sample data — 国勢調査 */

const SURVEY = {
  key: "kokusei-chosa",
  name: "国勢調査",
  organization: "総務省統計局",
  description: "国内の人口・世帯の実態を明らかにすることを目的とした、最も基本的で重要な統計調査。5年に1度、全国一斉に実施されます。",
  url: "https://www.stat.go.jp/data/kokusei/",
  firstYear: 1920,
  cycle: "5年ごと",
  latestYear: 2020,
  nextYear: 2025,
  method: "全数調査",
  rankingCount: 86,
  featuredCount: 6,
  categoryDistribution: [
    { name: "人口・世帯", count: 32, color: "#1d4ed8" },
    { name: "労働・賃金", count: 18, color: "#0891b2" },
    { name: "教育・文化", count: 14, color: "#7c3aed" },
    { name: "住宅", count: 12, color: "#0f766e" },
    { name: "外国人", count: 6, color: "#2563eb" },
    { name: "その他", count: 4, color: "#6b7280" },
  ],
};

const SURVEY_FEATURED = [
  { key: "population",         title: "総人口",         year: "2020", unit: "人",      top: "東京都", topVal: "1,396万",  color: "#1d4ed8", category: "人口・世帯" },
  { key: "population-density", title: "人口密度",       year: "2020", unit: "人/km²",  top: "東京都", topVal: "6,375",   color: "#0f766e", category: "人口・世帯" },
  { key: "household-count",    title: "世帯数",         year: "2020", unit: "世帯",    top: "東京都", topVal: "722万",   color: "#7c3aed", category: "人口・世帯" },
  { key: "single-household",   title: "単身世帯比率",   year: "2020", unit: "％",      top: "東京都", topVal: "50.2",    color: "#9333ea", category: "人口・世帯" },
  { key: "foreign-residents",  title: "外国人人口",     year: "2020", unit: "人",      top: "東京都", topVal: "55万",    color: "#2563eb", category: "外国人" },
  { key: "aging-rate",         title: "高齢化率",       year: "2020", unit: "％",      top: "秋田県", topVal: "37.5",    color: "#b45309", category: "人口・世帯" },
];

const SURVEY_RANKINGS = [
  { key: "population",          title: "総人口",                           year: "2020", unit: "人",       top: "東京都", topVal: "1,396万", category: "人口・世帯", featured: true },
  { key: "population-density",  title: "人口密度",                         year: "2020", unit: "人/km²",   top: "東京都", topVal: "6,375",   category: "人口・世帯", featured: true },
  { key: "household-count",     title: "世帯数",                           year: "2020", unit: "世帯",     top: "東京都", topVal: "722万",   category: "人口・世帯", featured: true },
  { key: "single-household",    title: "単身世帯比率",                     year: "2020", unit: "％",       top: "東京都", topVal: "50.2",    category: "人口・世帯", featured: true },
  { key: "youth-rate",          title: "年少人口比率",                     year: "2020", unit: "％",       top: "沖縄県", topVal: "16.5",    category: "人口・世帯" },
  { key: "working-age-rate",    title: "生産年齢人口比率",                 year: "2020", unit: "％",       top: "東京都", topVal: "65.6",    category: "人口・世帯" },
  { key: "aging-rate",          title: "高齢化率",                         year: "2020", unit: "％",       top: "秋田県", topVal: "37.5",    category: "人口・世帯", featured: true },
  { key: "average-household",   title: "平均世帯人員",                     year: "2020", unit: "人",       top: "山形県", topVal: "2.61",    category: "人口・世帯" },
  { key: "elderly-single",      title: "高齢単身世帯",                     year: "2020", unit: "％",       top: "鹿児島県", topVal: "16.5", category: "人口・世帯" },
  { key: "foreign-residents",   title: "外国人人口",                       year: "2020", unit: "人",       top: "東京都", topVal: "55万",    category: "外国人", featured: true },
  { key: "labor-force",         title: "労働力率",                         year: "2020", unit: "％",       top: "福井県", topVal: "65.4",    category: "労働・賃金" },
  { key: "employment-rate",     title: "就業率",                           year: "2020", unit: "％",       top: "福井県", topVal: "63.7",    category: "労働・賃金" },
  { key: "univ-grad",           title: "大学卒業者比率",                   year: "2020", unit: "％",       top: "東京都", topVal: "32.3",    category: "教育・文化" },
  { key: "owned-house",         title: "持ち家率",                         year: "2020", unit: "％",       top: "秋田県", topVal: "78.0",    category: "住宅" },
  { key: "house-area",          title: "1住宅あたり延べ面積",              year: "2020", unit: "m²",       top: "富山県", topVal: "143.5",   category: "住宅" },
];

const RELATED_SURVEYS = [
  { name: "人口動態調査",       organization: "厚生労働省",   cycle: "毎年",     rankingCount: 24 },
  { name: "住民基本台帳",       organization: "総務省",       cycle: "毎年",     rankingCount: 18 },
  { name: "人口推計",           organization: "総務省統計局", cycle: "毎月",     rankingCount: 14 },
  { name: "経済センサス",       organization: "総務省統計局", cycle: "5年ごと",  rankingCount: 38 },
  { name: "就業構造基本調査",   organization: "総務省統計局", cycle: "5年ごと",  rankingCount: 28 },
];

Object.assign(window, {
  SURVEY, SURVEY_FEATURED, SURVEY_RANKINGS, RELATED_SURVEYS,
});
