/* Shared components & sample data for stats47 themes redesign options. */

// ---------- Sample data: population-dynamics theme ----------
const THEME = {
  themeKey: "population-dynamics",
  title: "人口動態",
  description: "出生率・死亡率・人口増減・年齢構成など、47都道府県の人口動態を多角的に比較できるダッシュボード。",
  keywords: ["人口", "出生率", "死亡率", "高齢化"],
  category: "人口・世帯",
  totalIndicators: 12,
  lastUpdated: "2025-04-12",
  source: "総務省統計局 / 厚生労働省",
};

const INDICATORS = [
  { key: "population",          title: "総人口",          unit: "人",      latestYear: "2024", top1: "東京都",     top1Val: "1,401万",   trend: [128, 127, 126, 125, 124.5, 124], color: "#1d4ed8" },
  { key: "population-density",  title: "人口密度",        unit: "人/km²",   latestYear: "2024", top1: "東京都",     top1Val: "6,398",     trend: [6280, 6310, 6350, 6370, 6390, 6398], color: "#0f766e" },
  { key: "population-change",   title: "人口増減率",      unit: "％",       latestYear: "2024", top1: "沖縄県",     top1Val: "+2.7",     trend: [3.1, 2.9, 2.8, 2.8, 2.7, 2.7], color: "#15803d" },
  { key: "birth-rate",          title: "出生率",          unit: "‰",        latestYear: "2024", top1: "沖縄県",     top1Val: "9.7",      trend: [10.5, 10.2, 10.0, 9.9, 9.8, 9.7], color: "#dc2626" },
  { key: "death-rate",          title: "死亡率",          unit: "‰",        latestYear: "2024", top1: "秋田県",     top1Val: "16.5",     trend: [14.2, 14.8, 15.4, 15.8, 16.1, 16.5], color: "#7c3aed" },
  { key: "total-fertility",     title: "合計特殊出生率",  unit: "",         latestYear: "2024", top1: "沖縄県",     top1Val: "1.70",     trend: [1.86, 1.82, 1.80, 1.75, 1.72, 1.70], color: "#db2777" },
  { key: "aging-rate",          title: "高齢化率",        unit: "％",       latestYear: "2024", top1: "秋田県",     top1Val: "39.0",     trend: [33.8, 35.0, 36.2, 37.4, 38.2, 39.0], color: "#b45309" },
  { key: "youth-rate",          title: "年少人口比率",    unit: "％",       latestYear: "2024", top1: "沖縄県",     top1Val: "16.4",     trend: [17.4, 17.1, 16.9, 16.7, 16.5, 16.4], color: "#0891b2" },
  { key: "working-age-rate",    title: "生産年齢人口比率", unit: "％",      latestYear: "2024", top1: "東京都",     top1Val: "65.1",     trend: [67.0, 66.5, 66.0, 65.7, 65.4, 65.1], color: "#4338ca" },
  { key: "natural-change",      title: "自然増減数",      unit: "千人",     latestYear: "2024", top1: "東京都",     top1Val: "-4.2",     trend: [-1.0, -2.0, -3.0, -3.5, -3.9, -4.2], color: "#be185d" },
  { key: "social-change",       title: "社会増減数",      unit: "千人",     latestYear: "2024", top1: "東京都",     top1Val: "+8.1",     trend: [5.0, 5.5, 6.5, 7.2, 7.8, 8.1], color: "#059669" },
  { key: "average-age",         title: "平均年齢",        unit: "歳",       latestYear: "2024", top1: "秋田県",     top1Val: "53.8",     trend: [51.2, 51.8, 52.4, 52.9, 53.4, 53.8], color: "#374151" },
];

const YEARS = ["2024", "2023", "2022", "2021", "2020", "2019"];

const PREF_LIST = [
  { name: "東京都", val: 1401, region: "関東" },
  { name: "神奈川県", val: 924, region: "関東" },
  { name: "大阪府", val: 878, region: "近畿" },
  { name: "愛知県", val: 749, region: "中部" },
  { name: "埼玉県", val: 733, region: "関東" },
  { name: "千葉県", val: 628, region: "関東" },
  { name: "兵庫県", val: 543, region: "近畿" },
  { name: "北海道", val: 518, region: "北海道" },
  { name: "福岡県", val: 512, region: "九州" },
  { name: "静岡県", val: 358, region: "中部" },
];

// Mini sparkline
function Sparkline({ data, color = "#1d4ed8", w = 120, h = 32, fill = true }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((d - min) / range) * (h - 8),
  ]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, display: "block" }}>
      {fill && (
        <path d={`${path} L${w},${h} L0,${h} Z`} fill={color} fillOpacity="0.12" />
      )}
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

// Indicator KPI card
function IndicatorCard({ ind, active = false, onClick }) {
  return (
    <button onClick={onClick} style={{
      cursor: "pointer", font: "inherit", textAlign: "left",
      padding: 14,
      border: `1.5px solid ${active ? ind.color : "var(--border)"}`,
      borderRadius: 10,
      background: active ? "#fff" : "var(--bg)",
      boxShadow: active ? `0 6px 20px -10px ${ind.color}44` : "var(--shadow-sm)",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative",
      transition: "all .15s",
    }}>
      {active && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 3, background: ind.color,
          borderTopLeftRadius: 10, borderTopRightRadius: 10,
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: active ? ind.color : "var(--fg-2)", lineHeight: 1.3 }}>
          {ind.title}
        </div>
        {active && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", background: ind.color, color: "#fff", borderRadius: 4 }}>選択中</span>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>1位 · {ind.top1}</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", lineHeight: 1.1 }}>
            {ind.top1Val} <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>{ind.unit}</span>
          </div>
        </div>
        <Sparkline data={ind.trend} color={ind.color} w={70} h={28} />
      </div>
    </button>
  );
}

// Stat tile (small)
function StatTile({ label, value, unit, sub, color = "var(--primary)" }) {
  return (
    <div style={{
      padding: 12,
      border: "1px solid var(--border)", borderRadius: 8,
      background: "#fff",
    }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>
        {value}<span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// Prefecture selection mini list
function PrefMini({ rows = PREF_LIST, color = "#1d4ed8", selected, onSelect }) {
  const max = Math.max(...rows.map(r => r.val));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((p, i) => {
        const active = selected === p.name;
        return (
          <button key={p.name}
            onClick={() => onSelect?.(p.name)}
            style={{
              cursor: "pointer", font: "inherit", textAlign: "left",
              border: 0, padding: "6px 10px", borderRadius: 6,
              background: active ? "var(--primary-50)" : "transparent",
              display: "flex", alignItems: "center", gap: 10,
              transition: "background .12s",
            }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", width: 16 }}>{i + 1}</span>
            <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? "var(--primary)" : "var(--fg)", flex: 1 }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 600 }}>{p.val.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  );
}

// Compact map (uses JapanMap from components.jsx already)

Object.assign(window, {
  THEME, INDICATORS, YEARS, PREF_LIST,
  Sparkline, IndicatorCard, StatTile, PrefMini,
});
