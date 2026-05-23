/* Shared sample data + components for category page redesign. */

const CATEGORY = {
  key: "population-households",
  name: "人口・世帯",
  description: "47都道府県の人口・世帯に関する統計ランキング。総人口・人口密度・年齢構成・世帯数など、人口動態を多角的に比較できます。",
  totalRankings: 28,
  lastUpdated: "2025-04-12",
  color: "#1d4ed8",
  icon: "👥",
  siblings: [
    { key: "labor-wages", name: "労働・賃金", count: 24, icon: "💼" },
    { key: "healthcare", name: "医療・介護", count: 18, icon: "🏥" },
    { key: "education", name: "教育・文化", count: 21, icon: "📚" },
    { key: "tourism", name: "観光", count: 14, icon: "🗾" },
    { key: "safety", name: "安全・防災", count: 16, icon: "🚓" },
    { key: "local-economy", name: "地域経済", count: 19, icon: "💰" },
  ],
};

const FEATURED_RANKINGS = [
  { key: "population",         title: "総人口",          year: "2024", unit: "人",       top: "東京都", topVal: "1,401万",  color: "#1d4ed8" },
  { key: "population-density", title: "人口密度",        year: "2024", unit: "人/km²",    top: "東京都", topVal: "6,398",   color: "#0f766e" },
  { key: "household-count",    title: "世帯数",          year: "2023", unit: "世帯",      top: "東京都", topVal: "754万",   color: "#7c3aed" },
  { key: "aging-rate",         title: "高齢化率",        year: "2024", unit: "％",        top: "秋田県", topVal: "39.0",    color: "#b45309" },
  { key: "population-change",  title: "人口増減率",      year: "2024", unit: "％",        top: "沖縄県", topVal: "+2.7",    color: "#15803d" },
  { key: "average-household",  title: "平均世帯人員",     year: "2023", unit: "人",       top: "山形県", topVal: "2.61",    color: "#4338ca" },
];

const ALL_RANKINGS = [
  { key: "population",          title: "総人口",                       sub: "全国", year: "2024", unit: "人",       top: "東京都", topVal: "1,401万",  trend: [128, 127, 126, 125, 124.5, 124], color: "#1d4ed8", featured: true },
  { key: "population-density",  title: "人口密度",                     sub: null,   year: "2024", unit: "人/km²",    top: "東京都", topVal: "6,398",   trend: [6280, 6310, 6350, 6370, 6390, 6398], color: "#0f766e", featured: true },
  { key: "household-count",     title: "世帯数",                       sub: null,   year: "2023", unit: "世帯",      top: "東京都", topVal: "754万",   trend: [700, 715, 730, 740, 748, 754], color: "#7c3aed", featured: true },
  { key: "aging-rate",          title: "高齢化率",                     sub: "65歳以上", year: "2024", unit: "％",    top: "秋田県", topVal: "39.0",    trend: [35.0, 36.2, 37.4, 37.9, 38.4, 39.0], color: "#b45309", featured: true },
  { key: "population-change",   title: "人口増減率",                   sub: null,   year: "2024", unit: "％",        top: "沖縄県", topVal: "+2.7",    trend: [3.0, 2.9, 2.8, 2.8, 2.7, 2.7], color: "#15803d", featured: true },
  { key: "average-household",   title: "平均世帯人員",                 sub: null,   year: "2023", unit: "人",       top: "山形県", topVal: "2.61",    trend: [2.80, 2.75, 2.70, 2.66, 2.63, 2.61], color: "#4338ca", featured: true },
  { key: "youth-rate",          title: "年少人口比率",                 sub: "0-14歳", year: "2024", unit: "％",    top: "沖縄県", topVal: "16.4",    trend: [17.4, 17.1, 16.9, 16.7, 16.5, 16.4], color: "#0891b2" },
  { key: "working-age-rate",    title: "生産年齢人口比率",             sub: "15-64歳", year: "2024", unit: "％",   top: "東京都", topVal: "65.1",    trend: [67.0, 66.5, 66.0, 65.7, 65.4, 65.1], color: "#4338ca" },
  { key: "birth-rate",          title: "出生率",                       sub: "人口千対", year: "2023", unit: "‰",   top: "沖縄県", topVal: "9.7",     trend: [10.5, 10.2, 10.0, 9.9, 9.8, 9.7], color: "#dc2626" },
  { key: "death-rate",          title: "死亡率",                       sub: "人口千対", year: "2023", unit: "‰",   top: "秋田県", topVal: "16.5",    trend: [14.2, 14.8, 15.4, 15.8, 16.1, 16.5], color: "#7c3aed" },
  { key: "total-fertility",     title: "合計特殊出生率",               sub: null,   year: "2023", unit: "",          top: "沖縄県", topVal: "1.70",    trend: [1.86, 1.82, 1.80, 1.75, 1.72, 1.70], color: "#db2777" },
  { key: "marriage-rate",       title: "婚姻率",                       sub: "人口千対", year: "2023", unit: "‰",   top: "東京都", topVal: "5.4",     trend: [5.8, 5.7, 5.5, 5.5, 5.4, 5.4], color: "#ea580c" },
  { key: "divorce-rate",        title: "離婚率",                       sub: "人口千対", year: "2023", unit: "‰",   top: "沖縄県", topVal: "2.13",    trend: [2.10, 2.08, 2.12, 2.10, 2.12, 2.13], color: "#0e7490" },
  { key: "foreign-residents",   title: "外国人人口",                   sub: null,   year: "2023", unit: "人",       top: "東京都", topVal: "63万",    trend: [55, 56, 58, 60, 62, 63], color: "#2563eb" },
  { key: "single-household",    title: "単身世帯比率",                 sub: null,   year: "2020", unit: "％",       top: "東京都", topVal: "50.2",    trend: [45.0, 46.2, 47.5, 48.5, 49.4, 50.2], color: "#9333ea" },
  { key: "couple-household",    title: "夫婦のみ世帯比率",             sub: null,   year: "2020", unit: "％",       top: "和歌山県", topVal: "23.8",  trend: [22.0, 22.5, 23.0, 23.3, 23.6, 23.8], color: "#f59e0b" },
  { key: "elderly-single",      title: "高齢単身世帯",                 sub: "65歳以上", year: "2020", unit: "％",  top: "鹿児島県", topVal: "16.5", trend: [14.0, 14.5, 15.2, 15.7, 16.1, 16.5], color: "#b91c1c" },
  { key: "child-household",     title: "子どものいる世帯比率",         sub: null,   year: "2020", unit: "％",       top: "沖縄県", topVal: "29.8",    trend: [33.0, 32.5, 31.8, 31.0, 30.4, 29.8], color: "#16a34a" },
];

const LATEST_ARTICLES = [
  { slug: "tokyo-population", title: "東京都の人口推移と一極集中の現状", date: "2025-04-12" },
  { slug: "regional-decline", title: "地方衰退の構造的要因 ─ 47都道府県データで見る", date: "2025-03-28" },
  { slug: "aging-akita", title: "高齢化率1位の秋田 — 数字が示す医療・介護の課題", date: "2025-01-30" },
];

// Tile map placeholder (mini choropleth for FeaturedRankingCard)
function TileMapMini({ color = "#1d4ed8", size = 8 }) {
  // 7-column tile arrangement representing Japan
  const cells = [];
  // crude approximation of prefecture tile layout
  const layout = [
    [6, 0],
    [6, 1], [5, 1],
    [6, 2], [5, 2], [4, 2],
    [5, 3], [4, 3],
    [6, 4], [5, 4], [4, 4], [3, 4],
    [4, 5], [3, 5], [2, 5],
    [4, 6], [3, 6], [2, 6],
    [3, 7], [2, 7], [1, 7],
    [2, 8], [1, 8], [0, 8],
    [1, 9], [0, 9],
  ];
  return (
    <svg viewBox={`0 0 ${10 * size} ${10 * size}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {layout.map(([x, y], i) => (
        <rect
          key={i}
          x={x * size} y={y * size}
          width={size - 1} height={size - 1}
          fill={color}
          fillOpacity={0.2 + (i / layout.length) * 0.8}
          rx={1}
        />
      ))}
    </svg>
  );
}

// Featured Ranking Card (current style improved)
function FeaturedRankingCardCompact({ r }) {
  return (
    <a href="#" className="card" style={{
      display: "block", padding: 12,
      textDecoration: "none", color: "var(--fg)",
      transition: "all .15s",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 56, flexShrink: 0 }}>
          <TileMapMini color={r.color} size={7} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</div>
          <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{r.year}年 · 単位 {r.unit}</div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
            <div className="muted" style={{ fontSize: 10.5 }}>1位</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{r.top}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.topVal}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

// Large featured card with mini bar chart
function FeaturedRankingCardLarge({ r, all }) {
  return (
    <a href="#" className="card" style={{
      display: "flex", flexDirection: "column", gap: 12,
      padding: 16, textDecoration: "none", color: "var(--fg)",
      borderTop: `3px solid ${r.color}`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
            ⭐️ 注目
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, lineHeight: 1.35 }}>{r.title}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{r.year}年 · {r.unit}</div>
        </div>
        <div style={{ width: 64, flexShrink: 0 }}>
          <TileMapMini color={r.color} size={7} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
        {(all || [
          { rank: 1, name: r.top, val: r.topVal, w: 100 },
          { rank: 2, name: "神奈川県", val: "924万", w: 66 },
          { rank: 3, name: "大阪府", val: "878万", w: 63 },
        ]).map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr 70px", gap: 6, alignItems: "center", fontSize: 12 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              width: 16, height: 16, borderRadius: "50%",
              background: p.rank === 1 ? "#fbbf24" : p.rank === 2 ? "#cbd5e1" : "#fdba74",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>{p.rank}</span>
            <div style={{ height: 6, borderRadius: 999, background: "var(--bg-muted)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, width: `${p.w}%`, background: r.color, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--fg-2)" }}>{p.name}</span>
              <span className="mono" style={{ fontWeight: 700 }}>{p.val}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>47位まで見る</span>
        <span style={{ color: r.color, fontSize: 12, fontWeight: 600 }}>→</span>
      </div>
    </a>
  );
}

Object.assign(window, {
  CATEGORY, FEATURED_RANKINGS, ALL_RANKINGS, LATEST_ARTICLES,
  TileMapMini, FeaturedRankingCardCompact, FeaturedRankingCardLarge,
});
