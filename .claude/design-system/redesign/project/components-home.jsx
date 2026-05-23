/* Home page sample data + helpers */

const HOME_STATS = [
  { value: "1,800", suffix: "+", label: "ランキング指標" },
  { value: "47", suffix: "", label: "都道府県" },
  { value: "1,741", suffix: "", label: "市区町村" },
  { value: "30", suffix: "+", label: "年間時系列" },
];

const HOME_PREFECTURES = [
  ["北海道", "01"], ["青森", "02"], ["岩手", "03"], ["宮城", "04"], ["秋田", "05"], ["山形", "06"], ["福島", "07"],
  ["茨城", "08"], ["栃木", "09"], ["群馬", "10"], ["埼玉", "11"], ["千葉", "12"], ["東京", "13"], ["神奈川", "14"],
  ["新潟", "15"], ["富山", "16"], ["石川", "17"], ["福井", "18"], ["山梨", "19"], ["長野", "20"], ["岐阜", "21"],
  ["静岡", "22"], ["愛知", "23"], ["三重", "24"], ["滋賀", "25"], ["京都", "26"], ["大阪", "27"], ["兵庫", "28"],
  ["奈良", "29"], ["和歌山", "30"], ["鳥取", "31"], ["島根", "32"], ["岡山", "33"], ["広島", "34"], ["山口", "35"],
  ["徳島", "36"], ["香川", "37"], ["愛媛", "38"], ["高知", "39"], ["福岡", "40"], ["佐賀", "41"], ["長崎", "42"],
  ["熊本", "43"], ["大分", "44"], ["宮崎", "45"], ["鹿児島", "46"], ["沖縄", "47"],
];

const HOME_FEATURED = [
  { key: "population",         title: "総人口",       year: "2024", unit: "人",       top: "東京都", topVal: "1,401万",  color: "#1d4ed8" },
  { key: "aging-rate",         title: "高齢化率",     year: "2024", unit: "％",       top: "秋田県", topVal: "39.0",    color: "#b45309" },
  { key: "avg-income",         title: "平均年収",     year: "2023", unit: "万円",     top: "東京都", topVal: "622",     color: "#15803d" },
  { key: "tourism",            title: "観光客数",     year: "2024", unit: "万人",     top: "東京都", topVal: "5,890",   color: "#db2777" },
  { key: "house-price",        title: "住宅価格",     year: "2024", unit: "万円/m²",  top: "東京都", topVal: "112",     color: "#9333ea" },
  { key: "crime-rate",         title: "犯罪発生率",   year: "2023", unit: "‰",       top: "大阪府", topVal: "8.2",     color: "#dc2626" },
  { key: "doctor-count",       title: "医師数",       year: "2023", unit: "人/10万", top: "高知県", topVal: "327",     color: "#0891b2" },
  { key: "edu-spending",       title: "教育支出",     year: "2023", unit: "万円",     top: "東京都", topVal: "85",      color: "#7c3aed" },
];

const HOME_THEMES = [
  { key: "population-dynamics", name: "人口動態",     icon: "📈", color: "#1d4ed8", count: 12 },
  { key: "aging-society",       name: "高齢化社会",   icon: "👴", color: "#b45309", count: 10 },
  { key: "living-housing",      name: "住まい",       icon: "🏠", color: "#0f766e", count: 14 },
  { key: "local-economy",       name: "地域経済",     icon: "💰", color: "#15803d", count: 19 },
  { key: "labor-wages",         name: "労働・賃金",   icon: "💼", color: "#0891b2", count: 24 },
  { key: "healthcare",          name: "医療・介護",   icon: "🏥", color: "#dc2626", count: 18 },
  { key: "education-culture",   name: "教育・文化",   icon: "📚", color: "#7c3aed", count: 21 },
  { key: "tourism",             name: "観光",         icon: "🗾", color: "#db2777", count: 14 },
  { key: "safety",              name: "安全・防災",   icon: "🚓", color: "#92400e", count: 16 },
  { key: "consumer-prices",     name: "物価",         icon: "🛒", color: "#9333ea", count: 12 },
  { key: "foreign-residents",   name: "外国人住民",   icon: "🌏", color: "#2563eb", count: 8 },
  { key: "real-income",         name: "実質所得",     icon: "📊", color: "#059669", count: 10 },
];

const HOME_ARTICLES = [
  { slug: "tokyo-population", title: "東京都の人口推移と一極集中の現状", date: "2025-04-12", category: "人口・世帯", thumb: "linear-gradient(135deg, #dbeafe, #1d4ed8)" },
  { slug: "regional-decline", title: "地方衰退の構造的要因 ─ 47都道府県データで見る", date: "2025-03-28", category: "人口・世帯", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
  { slug: "aging-akita",      title: "高齢化率1位の秋田 — 数字が示す医療・介護の課題", date: "2025-01-30", category: "医療・介護", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
  { slug: "income-gap",       title: "47都道府県の所得格差 ─ 上位と下位で何倍?", date: "2025-01-15", category: "労働・賃金", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
];

// SVG Japan with all prefectures clickable (for hero map)
function JapanInteractiveMap({ highlight = null, size = "lg" }) {
  const prefs = [
    [78, 28, "01", "北海道"], [76, 50, "02", "青森"], [82, 56, "03", "岩手"],
    [73, 56, "05", "秋田"], [82, 64, "04", "宮城"], [77, 66, "06", "山形"],
    [80, 73, "07", "福島"], [73, 75, "09", "栃木"], [78, 80, "08", "茨城"],
    [70, 79, "10", "群馬"], [73, 84, "11", "埼玉"], [78, 86, "12", "千葉"],
    [73, 88, "13", "東京"], [70, 91, "14", "神奈川"], [63, 75, "15", "新潟"],
    [60, 80, "16", "富山"], [56, 82, "17", "石川"], [55, 86, "18", "福井"],
    [65, 86, "19", "山梨"], [65, 92, "20", "長野"], [60, 90, "21", "岐阜"],
    [62, 95, "22", "静岡"], [56, 92, "23", "愛知"], [50, 92, "24", "三重"],
    [47, 90, "25", "滋賀"], [44, 92, "26", "京都"], [43, 96, "27", "大阪"],
    [40, 92, "28", "兵庫"], [40, 98, "29", "奈良"], [38, 100, "30", "和歌山"],
    [35, 90, "31", "鳥取"], [33, 94, "32", "島根"], [33, 88, "33", "岡山"],
    [30, 92, "34", "広島"], [27, 96, "35", "山口"], [27, 102, "36", "徳島"],
    [24, 100, "37", "香川"], [22, 104, "38", "愛媛"], [20, 108, "39", "高知"],
    [16, 100, "40", "福岡"], [12, 104, "41", "佐賀"], [10, 108, "42", "長崎"],
    [16, 106, "43", "熊本"], [18, 112, "44", "大分"], [13, 114, "45", "宮崎"],
    [10, 118, "46", "鹿児島"], [5, 130, "47", "沖縄"],
  ];
  return (
    <svg viewBox="0 0 100 140" style={{ width: "100%", height: "auto", display: "block" }}>
      {prefs.map(([x, y, code, name], i) => {
        const isActive = code === highlight;
        return (
          <g key={i} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={isActive ? 4 : 3} fill={isActive ? "#1d4ed8" : "#bfdbfe"} stroke="#fff" strokeWidth="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

// Featured ranking card (mini)
function FeaturedHomeCard({ r }) {
  return (
    <a href="#" className="card" style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: 14, textDecoration: "none", color: "var(--fg)",
      borderTop: `3px solid ${r.color}`,
      transition: "all .15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div className="muted" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {r.year}年 · {r.unit}
        </div>
        <div style={{ width: 28, flexShrink: 0 }}>
          <TileMapMini color={r.color} size={6} />
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</div>
      <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="muted" style={{ fontSize: 10 }}>1位</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{r.top}</div>
        </div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: r.color }}>{r.topVal}</div>
      </div>
    </a>
  );
}

Object.assign(window, {
  HOME_STATS, HOME_PREFECTURES, HOME_FEATURED, HOME_THEMES, HOME_ARTICLES,
  JapanInteractiveMap, FeaturedHomeCard,
});
