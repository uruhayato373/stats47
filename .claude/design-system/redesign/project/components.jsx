/* Shared components for stats47 ranking redesign options.
   Exported to window so all option files can share them. */

const { useState } = React;

// ---------- Icons ----------
const Icon = ({ d, className = "icon", ...rest }) => (
  <svg viewBox="0 0 24 24" className={className} {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const Icons = {
  Map: <Icon d={["M9 4 3 6v14l6-2","9 4v14","9 4 15 6","15 6 21 4v14l-6 2","15 6v14"]} />,
  Table: <Icon d={["M3 5h18v14H3z","M3 10h18","M3 15h18","M9 5v14","M15 5v14"]} />,
  Download: <Icon d={["M12 4v12","m7 11 5 5 5-5","M5 20h14"]} />,
  Share: <Icon d={["M18 8a3 3 0 1 0-2.83-4","M6 15a3 3 0 1 0 2.83 4","M18 21a3 3 0 1 0 0-6","m8.59 13.51 6.83 3.98","m15.41 6.51-6.82 3.98"]} />,
  Chevron: <Icon d="m6 9 6 6 6-6" />,
  ChevronRight: <Icon d="m9 6 6 6-6 6" />,
  Users: <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M22 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]} />,
  Area: <Icon d={["m3 6 3-3h12l3 3","M3 6v14h18V6","M3 6h18","m9 13 2 2 4-4"]} />,
  Sigma: <Icon d={["M5 4h14l-7 8 7 8H5"]} />,
  Calendar: <Icon d={["M3 5h18v16H3z","M3 9h18","M8 3v4","M16 3v4"]} />,
  Info: <Icon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20","M12 8h.01","M11 12h1v4h1"]} />,
  Bookmark: <Icon d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-4 7 4z" />,
  Filter: <Icon d="M3 5h18l-7 9v6l-4-2v-4z" />,
  Search: <Icon d={["M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16","m21 21-4.3-4.3"]} />,
  Trend: <Icon d={["m3 17 6-6 4 4 8-8","M21 7v6h-6"]} />,
  Layer: <Icon d={["m12 3 9 5-9 5-9-5z","m3 13 9 5 9-5","m3 18 9 5 9-5"]} />,
  Sparkle: <Icon d={["M12 3v4","M12 17v4","M3 12h4","M17 12h4","m5.6 5.6 2.8 2.8","m15.6 15.6 2.8 2.8","m18.4 5.6-2.8 2.8","m8.4 15.6-2.8 2.8"]} />,
  External: <Icon d={["M15 3h6v6","M10 14 21 3","M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"]} />,
  Pin: <Icon d={["M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12","M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4"]} />,
  Mail: <Icon d={["M3 5h18v14H3z","m3 5 9 8 9-8"]} />,
};

// ---------- Sample data — 都道府県人口ランキング ----------
const TOP_DATA = [
  { rank: 1, name: "東京都", region: "関東", value: 14_010_000, ratio: 1.0 },
  { rank: 2, name: "神奈川県", region: "関東", value: 9_240_000, ratio: 0.66 },
  { rank: 3, name: "大阪府", region: "近畿", value: 8_780_000, ratio: 0.626 },
  { rank: 4, name: "愛知県", region: "中部", value: 7_490_000, ratio: 0.535 },
  { rank: 5, name: "埼玉県", region: "関東", value: 7_330_000, ratio: 0.523 },
  { rank: 6, name: "千葉県", region: "関東", value: 6_280_000, ratio: 0.448 },
  { rank: 7, name: "兵庫県", region: "近畿", value: 5_430_000, ratio: 0.388 },
  { rank: 8, name: "北海道", region: "北海道", value: 5_180_000, ratio: 0.370 },
  { rank: 9, name: "福岡県", region: "九州", value: 5_120_000, ratio: 0.366 },
  { rank: 10, name: "静岡県", region: "中部", value: 3_580_000, ratio: 0.256 },
  { rank: 11, name: "茨城県", region: "関東", value: 2_840_000, ratio: 0.203 },
  { rank: 12, name: "広島県", region: "中国", value: 2_750_000, ratio: 0.196 },
];

const FMT = new Intl.NumberFormat("ja-JP");
function fmtPop(n) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}億人`;
  if (n >= 10_000) return `${FMT.format(Math.round(n / 10_000))}万人`;
  return `${FMT.format(n)}人`;
}

// ---------- Breadcrumb ----------
function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.current
            ? <span className="current">{it.label}</span>
            : <a href="#">{it.label}</a>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ---------- Japan choropleth placeholder ----------
function JapanMap({ height = 380, theme = "blue" }) {
  // simplified prefecture-ish blob with colored circles by region
  const color = (v) => {
    const palette = theme === "blue"
      ? ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"]
      : ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#b45309"];
    return palette[Math.min(palette.length - 1, Math.floor(v * palette.length))];
  };
  // some "prefectures" — abstract blob positions
  const prefs = [
    [78, 28, 0.95, "北海道"], [76, 50, 0.62, "青森"], [82, 56, 0.50, "岩手"],
    [73, 56, 0.55, "秋田"], [82, 64, 0.58, "宮城"], [77, 66, 0.40, "山形"],
    [80, 73, 0.45, "福島"], [73, 75, 0.30, "栃木"], [78, 80, 0.55, "茨城"],
    [70, 79, 0.45, "群馬"], [73, 84, 0.85, "埼玉"], [78, 86, 0.78, "千葉"],
    [73, 88, 1.0, "東京"], [70, 91, 0.92, "神奈川"], [63, 75, 0.55, "新潟"],
    [60, 80, 0.30, "富山"], [56, 82, 0.30, "石川"], [55, 86, 0.25, "福井"],
    [65, 86, 0.30, "山梨"], [65, 92, 0.45, "長野"], [60, 90, 0.40, "岐阜"],
    [62, 95, 0.55, "静岡"], [56, 92, 0.92, "愛知"], [50, 92, 0.40, "三重"],
    [47, 90, 0.30, "滋賀"], [44, 92, 0.55, "京都"], [43, 96, 0.85, "大阪"],
    [40, 92, 0.75, "兵庫"], [40, 98, 0.25, "奈良"], [38, 100, 0.20, "和歌山"],
    [35, 90, 0.18, "鳥取"], [33, 94, 0.22, "島根"], [33, 88, 0.28, "岡山"],
    [30, 92, 0.58, "広島"], [27, 96, 0.20, "山口"], [27, 102, 0.18, "徳島"],
    [24, 100, 0.22, "香川"], [22, 104, 0.32, "愛媛"], [20, 108, 0.20, "高知"],
    [16, 100, 0.78, "福岡"], [12, 104, 0.20, "佐賀"], [10, 108, 0.30, "長崎"],
    [16, 106, 0.32, "熊本"], [18, 112, 0.25, "大分"], [13, 114, 0.20, "宮崎"],
    [10, 118, 0.30, "鹿児島"], [5, 130, 0.25, "沖縄"],
  ];
  return (
    <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <filter id="ds-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      {prefs.map(([x, y, v, name], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3.2} fill={color(v)} stroke="#fff" strokeWidth="0.4" />
        </g>
      ))}
      {/* tokyo highlight */}
      <circle cx={73} cy={88} r={4.5} fill="none" stroke="#1d4ed8" strokeWidth="0.8" strokeDasharray="1.2 0.6" />
      <text x={73} y={88 - 6} fontSize="3" fill="#1d4ed8" fontWeight="700" textAnchor="middle">東京 1位</text>
    </svg>
  );
}

// ---------- Color legend ----------
function MapLegend({ unit = "人", theme = "blue" }) {
  const stops = theme === "blue"
    ? ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"]
    : ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#b45309"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)" }}>
      <span>少</span>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", width: 140 }}>
        {stops.map((c, i) => <div key={i} style={{ background: c, flex: 1 }} />)}
      </div>
      <span>多</span>
      <span style={{ marginLeft: 8 }}>単位: {unit}</span>
    </div>
  );
}

// ---------- Ranking table ----------
function RankingTable({ rows, unit = "人", showBars = true, dense = false }) {
  return (
    <table className="rk">
      <thead>
        <tr>
          <th>順位</th>
          <th>都道府県</th>
          {showBars && <th></th>}
          <th style={{ textAlign: "right" }}>{unit === "人/km²" ? "人口密度" : "値"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.rank}>
            <td className="rank mono">
              {r.rank <= 3
                ? <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: "50%",
                    background: r.rank === 1 ? "#fbbf24" : r.rank === 2 ? "#cbd5e1" : "#fdba74",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                  }}>{r.rank}</span>
                : r.rank}
            </td>
            <td>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              {!dense && <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.region}</div>}
            </td>
            {showBars && (
              <td>
                <div className="bar"><div style={{ width: `${Math.max(8, r.ratio * 100)}%` }} /></div>
              </td>
            )}
            <td className="value">
              {unit === "人/km²"
                ? FMT.format(Math.round(r.value / 1000))
                : unit === "人"
                  ? fmtPop(r.value)
                  : `${(r.value / 100_000_000).toFixed(2)}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------- Right sidebar ----------
function RelatedSidebar({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <div className="h3">同じカテゴリのランキング</div>
        </div>
        <div className="card-body" style={{ padding: 6 }}>
          <div className="side-list">
            {[
              ["世帯数", "全国"],
              ["人口密度", "人/km²"],
              ["人口増減率", "％"],
              ["年少人口比率", "％"],
              ["生産年齢人口比率", "％"],
              ["高齢化率", "％"],
              ["昼夜間人口比率", "％"],
              ["外国人人口", "人"],
            ].map(([t, m], i) => (
              <a key={i} href="#">
                <span>{t}</span>
                <span className="meta">{m}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------- AdSense placeholder ----------
function AdSlot({ height = 250, label = "広告" }) {
  return (
    <div className="ad" style={{ minHeight: height, position: "relative", flexDirection: "column", gap: 6 }}>
      <div className="ad-label" style={{ position: "absolute", top: 6, left: 8 }}>{label}</div>
      <div style={{ opacity: 0.6 }}>AdSense — {height === 250 ? "Rectangle 300×250" : `${height}px`}</div>
    </div>
  );
}

// Native affiliate card (single)
function AffiliateCard({ region = "北海道", item = "夕張メロン 2玉ギフト", price = "¥5,980", source = "楽天市場" }) {
  return (
    <div className="aff-card">
      <div className="thumb" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span className="tag">PR</span>
          <span className="meta">{region}の特産品 · {source}</span>
        </div>
        <div className="title" style={{
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
        }}>{item}</div>
        <div className="price">{price}<span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11, marginLeft: 6 }}>送料無料</span></div>
      </div>
    </div>
  );
}

// ---------- Export ----------
Object.assign(window, {
  Icon, Icons, FMT, fmtPop, TOP_DATA,
  Breadcrumb, JapanMap, MapLegend, RankingTable,
  RelatedSidebar, AdSlot, AffiliateCard,
});
