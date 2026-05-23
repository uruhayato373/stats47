/* Sample data + components for area+category page redesign */

const AREA = {
  code: "13",
  name: "東京都",
  nameEn: "Tokyo",
  region: "関東",
  capital: "新宿区",
  area: "2,194 km²",
  population: 14010000,
  populationRank: 1,
  density: 6398,
  established: "1868",
  flagColor: "#1d4ed8",
  cities: [
    "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区",
    "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区",
    "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区",
    "八王子市", "立川市", "武蔵野市", "三鷹市", "青梅市", "府中市", "昭島市",
  ],
  neighbors: [
    { code: "11", name: "埼玉県" },
    { code: "12", name: "千葉県" },
    { code: "14", name: "神奈川県" },
    { code: "19", name: "山梨県" },
  ],
};

const AREA_CATEGORIES = [
  { key: "population-households", name: "人口・世帯", icon: "👥", color: "#1d4ed8", count: 28, active: true },
  { key: "labor-wages",           name: "労働・賃金", icon: "💼", color: "#0891b2", count: 24 },
  { key: "education-culture",     name: "教育・文化", icon: "📚", color: "#7c3aed", count: 21 },
  { key: "healthcare",            name: "医療・介護", icon: "🏥", color: "#dc2626", count: 18 },
  { key: "safety",                name: "安全・防災", icon: "🚓", color: "#b45309", count: 16 },
  { key: "local-economy",         name: "地域経済", icon: "💰", color: "#15803d", count: 19 },
  { key: "tourism",               name: "観光", icon: "🗾", color: "#db2777", count: 14 },
  { key: "consumer-prices",       name: "物価", icon: "🛒", color: "#9333ea", count: 12 },
  { key: "manufacturing",         name: "製造業", icon: "🏭", color: "#4338ca", count: 15 },
];

const AREA_KPIS = [
  { label: "総人口",       value: "1,401",  unit: "万人", rank: 1,  total: 47, trend: [1395, 1397, 1399, 1400, 1400, 1401], color: "#1d4ed8" },
  { label: "人口密度",     value: "6,398",  unit: "人/km²", rank: 1, total: 47, trend: [6280, 6310, 6350, 6370, 6390, 6398], color: "#0f766e" },
  { label: "世帯数",       value: "754",    unit: "万世帯", rank: 1, total: 47, trend: [700, 715, 730, 740, 748, 754], color: "#7c3aed" },
  { label: "高齢化率",     value: "23.5",   unit: "％",    rank: 47, total: 47, trend: [22.1, 22.4, 22.7, 23.0, 23.2, 23.5], color: "#b45309", isLow: true },
  { label: "出生率",       value: "6.4",    unit: "‰",     rank: 32, total: 47, trend: [7.0, 6.8, 6.6, 6.5, 6.4, 6.4], color: "#dc2626" },
  { label: "平均世帯人員", value: "1.95",   unit: "人",    rank: 47, total: 47, trend: [2.05, 2.02, 2.00, 1.98, 1.97, 1.95], color: "#4338ca", isLow: true },
];

const AREA_RANKINGS_IN_CATEGORY = [
  { title: "総人口",          rank: 1,  value: "1,401万人",      change: "+0.07%" },
  { title: "人口密度",        rank: 1,  value: "6,398 人/km²",  change: "+0.13%" },
  { title: "世帯数",          rank: 1,  value: "754万世帯",      change: "+0.80%" },
  { title: "外国人人口",      rank: 1,  value: "63万人",         change: "+1.40%" },
  { title: "単身世帯比率",    rank: 1,  value: "50.2%",         change: "+0.30%" },
  { title: "生産年齢人口比率", rank: 1,  value: "65.1%",         change: "-0.30%" },
  { title: "婚姻率",          rank: 1,  value: "5.4‰",          change: "0.00" },
  { title: "高齢化率",        rank: 47, value: "23.5%",         change: "+0.30%" },
  { title: "出生率",          rank: 32, value: "6.4‰",          change: "-0.10%" },
  { title: "平均世帯人員",    rank: 47, value: "1.95人",        change: "-0.02" },
  { title: "離婚率",          rank: 18, value: "1.82‰",         change: "-0.03" },
  { title: "合計特殊出生率",  rank: 47, value: "0.99",          change: "-0.04" },
];

// Area KPI card (used in Options)
function AreaKpiCard({ k, size = "md" }) {
  const isTop = k.rank === 1;
  const isBottom = k.rank === k.total;
  return (
    <div className="card" style={{
      padding: size === "lg" ? 18 : 14,
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden",
      borderTop: `3px solid ${k.color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.02em" }}>{k.label}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          background: isTop ? "#fef3c7" : isBottom ? "#fee2e2" : "var(--bg-muted)",
          color: isTop ? "#92400e" : isBottom ? "#991b1b" : "var(--muted)",
        }}>
          {isTop ? "👑 1位" : isBottom ? `最下位 ${k.rank}` : `${k.rank}位`}/{k.total}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div className="mono" style={{ fontSize: size === "lg" ? 30 : 24, fontWeight: 800, color: "var(--fg)", lineHeight: 1 }}>
          {k.value}
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginLeft: 3 }}>{k.unit}</span>
        </div>
        <Sparkline data={k.trend} color={k.color} w={size === "lg" ? 70 : 60} h={size === "lg" ? 30 : 26} />
      </div>
    </div>
  );
}

// Tokyo SVG-ish silhouette (rough) for hero
function PrefSilhouette({ color = "#1d4ed8", size = 90 }) {
  return (
    <svg viewBox="0 0 100 70" style={{ width: size, height: "auto" }}>
      <defs>
        <linearGradient id="pref-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d="M5,30 C8,22 16,18 22,18 C28,18 32,14 38,15 C46,16 52,12 58,14 C66,16 70,12 78,18 C86,20 92,28 88,38 C84,46 78,48 72,48 C66,52 58,54 50,52 C44,54 36,52 30,48 C24,46 18,44 12,40 C6,38 4,34 5,30 Z" fill="url(#pref-grad)" />
      <circle cx="55" cy="30" r="3" fill="#fff" stroke={color} strokeWidth="1" />
      <text x="55" y="44" fontSize="6" fill={color} fontWeight="700" textAnchor="middle">●</text>
    </svg>
  );
}

// Mini japan map highlight (selected prefecture)
function JapanHighlight({ highlightCode = "13", color = "#1d4ed8" }) {
  // Reuse JapanMap from components.jsx but simplified
  const prefs = [
    [78, 28, "01"], [76, 50, "02"], [82, 56, "03"],
    [73, 56, "05"], [82, 64, "04"], [77, 66, "06"],
    [80, 73, "07"], [73, 75, "09"], [78, 80, "08"],
    [70, 79, "10"], [73, 84, "11"], [78, 86, "12"],
    [73, 88, "13"], [70, 91, "14"], [63, 75, "15"],
    [60, 80, "16"], [56, 82, "17"], [55, 86, "18"],
    [65, 86, "19"], [65, 92, "20"], [60, 90, "21"],
    [62, 95, "22"], [56, 92, "23"], [50, 92, "24"],
    [47, 90, "25"], [44, 92, "26"], [43, 96, "27"],
    [40, 92, "28"], [40, 98, "29"], [38, 100, "30"],
    [35, 90, "31"], [33, 94, "32"], [33, 88, "33"],
    [30, 92, "34"], [27, 96, "35"], [27, 102, "36"],
    [24, 100, "37"], [22, 104, "38"], [20, 108, "39"],
    [16, 100, "40"], [12, 104, "41"], [10, 108, "42"],
    [16, 106, "43"], [18, 112, "44"], [13, 114, "45"],
    [10, 118, "46"], [5, 130, "47"],
  ];
  return (
    <svg viewBox="0 0 100 140" style={{ width: "100%", height: "auto" }}>
      {prefs.map(([x, y, code], i) => {
        const isActive = code === highlightCode;
        return (
          <circle key={i} cx={x} cy={y} r={isActive ? 5 : 2.6}
            fill={isActive ? color : "#cbd5e1"} stroke="#fff" strokeWidth="0.4" />
        );
      })}
      {/* label */}
      {(() => {
        const p = prefs.find((p) => p[2] === highlightCode);
        if (!p) return null;
        return (
          <g>
            <text x={p[0]} y={p[1] - 7} fontSize="3.4" fontWeight="700" fill={color} textAnchor="middle">{AREA.name}</text>
          </g>
        );
      })()}
    </svg>
  );
}

Object.assign(window, {
  AREA, AREA_CATEGORIES, AREA_KPIS, AREA_RANKINGS_IN_CATEGORY,
  AreaKpiCard, PrefSilhouette, JapanHighlight,
});
