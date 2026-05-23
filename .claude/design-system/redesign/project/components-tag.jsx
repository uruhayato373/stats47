/* Tag page sample data */

const TAG = {
  key: "population",
  name: "人口",
  description: "人口・人口動態に関する記事。都道府県別の人口集中・人口減少・年齢構成などをデータで読み解きます。",
  articleCount: 14,
  totalReads: 28400,
  followers: 124,
  relatedTags: [
    { name: "東京都", count: 8 },
    { name: "高齢化", count: 7 },
    { name: "出生率", count: 6 },
    { name: "都市集中", count: 6 },
    { name: "地方創生", count: 5 },
    { name: "外国人", count: 4 },
    { name: "経済", count: 4 },
    { name: "労働", count: 3 },
  ],
  relatedRankings: [
    { key: "population",         title: "総人口",         unit: "人" },
    { key: "population-density", title: "人口密度",       unit: "人/km²" },
    { key: "population-change",  title: "人口増減率",     unit: "％" },
    { key: "aging-rate",         title: "高齢化率",       unit: "％" },
    { key: "birth-rate",         title: "出生率",         unit: "‰" },
  ],
};

const TAG_ARTICLES = [
  { slug: "tokyo-population", title: "東京都の人口推移と一極集中の現状", date: "2025-04-12", category: "人口・世帯", tags: ["人口", "東京都"], readMinutes: 7, thumb: "linear-gradient(135deg, #dbeafe, #1d4ed8)", views: 4820 },
  { slug: "regional-decline", title: "地方衰退の構造的要因 ─ 47都道府県データで見る課題", date: "2025-03-28", category: "人口・世帯", tags: ["人口", "地方創生"], readMinutes: 9, thumb: "linear-gradient(135deg, #fde68a, #f59e0b)", views: 3120 },
  { slug: "tokyo-concentration", title: "東京一極集中はなぜ進むのか — 人口・経済・産業の3視点", date: "2025-03-15", category: "経済", tags: ["人口", "東京都", "経済"], readMinutes: 9, thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)", views: 2680 },
  { slug: "akita-population", title: "秋田県の人口減少率はなぜ全国最大なのか", date: "2025-02-20", category: "人口・世帯", tags: ["人口", "秋田県"], readMinutes: 6, thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)", views: 2010 },
  { slug: "city-vs-rural", title: "都市と地方で異なる年齢構成のリアル", date: "2025-02-05", category: "人口・世帯", tags: ["人口", "高齢化"], readMinutes: 5, thumb: "linear-gradient(135deg, #c7d2fe, #4338ca)", views: 1840 },
  { slug: "metro-areas-ranking", title: "三大都市圏ランキング 2024 ─ 人口・GDP・通勤率", date: "2025-01-30", category: "経済", tags: ["人口", "都市圏"], readMinutes: 8, thumb: "linear-gradient(135deg, #fef3c7, #fbbf24)", views: 1620 },
  { slug: "foreign-population", title: "外国人住民が多い都道府県 ─ 増加トレンドの背景", date: "2025-01-15", category: "人口・世帯", tags: ["人口", "外国人"], readMinutes: 7, thumb: "linear-gradient(135deg, #ddd6fe, #7c3aed)", views: 1430 },
  { slug: "fertility-rate", title: "合計特殊出生率と地域差 ─ 沖縄1.70の理由", date: "2024-12-20", category: "人口・世帯", tags: ["人口", "出生率"], readMinutes: 6, thumb: "linear-gradient(135deg, #fecaca, #dc2626" + ")", views: 1280 },
  { slug: "population-pyramid", title: "47都道府県の人口ピラミッド比較 (1990→2024)", date: "2024-12-08", category: "人口・世帯", tags: ["人口", "推移"], readMinutes: 10, thumb: "linear-gradient(135deg, #bae6fd, #0284c7)", views: 1090 },
];

Object.assign(window, { TAG, TAG_ARTICLES });
