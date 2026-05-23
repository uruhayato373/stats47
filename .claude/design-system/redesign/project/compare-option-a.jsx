/* Compare Option A — 整理改善 (低リスク・現行構造踏襲)
   - h1: text-lg → 30px
   - リージョン・セレクタを大型のカード化(地図 + ドロップダウン + VS)
   - カテゴリ・タブをドロップダウンから横一列ピルへ
   - KPI 比較カード(現行よりも見やすく + 差分%表示)
   - チャート + 出典 + CSV */

function CompareOptionA() {
  const [A, B] = COMPARE_REGIONS;
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "比較ツール" }, { label: COMPARE_CATEGORY.name, current: true }]} />
      </div>

      <header style={{ padding: "12px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="pill primary">地域間比較</span>
        </div>
        <h1 className="h1" style={{ fontSize: 30 }}>{A.name} <span style={{ color: "var(--muted)" }}>vs</span> {B.name}</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--muted)", maxWidth: 720, lineHeight: 1.65 }}>
          {COMPARE_CATEGORY.icon} {COMPARE_CATEGORY.name}カテゴリの統計を、2つの都道府県で並べて比較
        </p>
      </header>

      {/* Category pills */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>カテゴリを切替</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {COMPARE_CATEGORIES.map((c) => (
            <button key={c.key} style={{
              cursor: "pointer", font: "inherit", whiteSpace: "nowrap", flexShrink: 0,
              padding: "7px 14px", borderRadius: 999,
              border: `1px solid ${c.active ? "var(--primary)" : "var(--border)"}`,
              background: c.active ? "var(--primary)" : "#fff",
              color: c.active ? "#fff" : "var(--fg-2)",
              fontSize: 12.5, fontWeight: c.active ? 700 : 500,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span>{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Region selector */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 60px 1fr 200px", gap: 16, alignItems: "center" }}>
          <RegionPicker side="A" region={A} />
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: "var(--muted)" }}>VS</div>
          <RegionPicker side="B" region={B} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="btn btn-primary" style={{ justifyContent: "center" }}>
              {React.cloneElement(Icons.Download, { className: "icon" })} CSV
            </button>
            <button className="btn" style={{ justifyContent: "center" }}>
              {React.cloneElement(Icons.Share, { className: "icon" })} 共有
            </button>
          </div>
        </div>
      </div>

      {/* KPI head-to-head */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="h2" style={{ marginBottom: 10 }}>主要指標の比較</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COMPARE_KPIS.map((k, i) => <KpiH2H key={i} k={k} A={A} B={B} />)}
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="h2" style={{ marginBottom: 10 }}>チャート比較</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["年齢階層別人口", "人口推移", "世帯構成", "出生・死亡推移"].map((t, i) => (
            <ChartCard key={i} title={t} A={A} B={B} />
          ))}
        </div>
      </div>

      {/* Indicator table */}
      <div style={{ padding: "20px 24px 24px" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="h2">全{COMPARE_INDICATORS.length}指標の数値</div>
          <button className="btn btn-sm">
            {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} この表をCSV
          </button>
        </div>
        <div className="card">
          <table className="rk">
            <thead>
              <tr>
                <th>指標</th>
                <th style={{ textAlign: "right", color: A.color }}>{A.name}</th>
                <th style={{ textAlign: "right", color: B.color }}>{B.name}</th>
                <th style={{ textAlign: "right" }}>差分</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_INDICATORS.map((r, i) => (
                <tr key={i}>
                  <td><a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.name}</a></td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: A.color }}>{r.aVal}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: B.color }}>{r.bVal}</td>
                  <td className="mono" style={{
                    textAlign: "right", fontWeight: 700, fontSize: 12,
                    color: r.diff.startsWith("-") ? "var(--danger)" : "var(--accent)",
                  }}>{r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegionPicker({ side, region }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: 10, borderRadius: 10,
      border: `2px solid ${region.color}`,
      background: region.lightColor,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: region.color, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, flexShrink: 0,
      }}>{side}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="muted" style={{ fontSize: 10, fontWeight: 600 }}>{region.region}地方</div>
        <select className="select" style={{ width: "100%", padding: "5px 8px", border: 0, background: "transparent", fontSize: 15, fontWeight: 700, color: region.color }}>
          <option>{region.name}</option>
        </select>
      </div>
    </div>
  );
}

function KpiH2H({ k, A, B }) {
  const aIsBetter = k.lowerBetter ? k.aVal < k.bVal : k.aVal > k.bVal;
  const max = Math.max(k.aVal, k.bVal);
  return (
    <div className="card" style={{ padding: 14, display: "grid", gridTemplateColumns: "120px 1fr 1fr 80px", gap: 14, alignItems: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{k.label}</div>
      {/* A bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: A.color, fontWeight: 700 }}>{A.name}</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: A.color }}>
            {k.aVal.toLocaleString()}<span style={{ fontSize: 9, marginLeft: 2, color: "var(--muted)" }}>{k.unit}</span>
          </span>
        </div>
        <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${(k.aVal / max) * 100}%`, height: "100%", background: A.color }} />
        </div>
        <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>全国 {k.aRank}位/47</div>
      </div>
      {/* B bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: B.color, fontWeight: 700 }}>{B.name}</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: B.color }}>
            {k.bVal.toLocaleString()}<span style={{ fontSize: 9, marginLeft: 2, color: "var(--muted)" }}>{k.unit}</span>
          </span>
        </div>
        <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${(k.bVal / max) * 100}%`, height: "100%", background: B.color }} />
        </div>
        <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>全国 {k.bRank}位/47</div>
      </div>
      <div style={{
        padding: "5px 10px", borderRadius: 8,
        background: aIsBetter ? A.lightColor : B.lightColor,
        color: aIsBetter ? A.color : B.color,
        fontWeight: 700, fontSize: 12, textAlign: "center",
      }} className="mono">
        {aIsBetter ? `↑ ${A.name.slice(0, 2)}` : `↑ ${B.name.slice(0, 2)}`}
      </div>
    </div>
  );
}

function ChartCard({ title, A, B }) {
  return (
    <div className="card">
      <div className="card-header" style={{ padding: "10px 14px" }}>
        <div className="h3">{title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, padding: "1px 6px", background: A.color, color: "#fff", borderRadius: 3, fontWeight: 600 }}>{A.name}</span>
          <span style={{ fontSize: 10, padding: "1px 6px", background: B.color, color: "#fff", borderRadius: 3, fontWeight: 600 }}>{B.name}</span>
        </div>
      </div>
      <div style={{ height: 180, padding: 12 }}>
        <svg viewBox="0 0 300 160" style={{ width: "100%", height: "100%" }}>
          <path d="M 20 140 Q 80 70 150 90 T 280 50" stroke={A.color} strokeWidth="2.5" fill="none" />
          <path d="M 20 130 Q 80 110 150 110 T 280 95" stroke={B.color} strokeWidth="2.5" fill="none" strokeDasharray="4 3" />
          <circle cx="280" cy="50" r="4" fill={A.color} />
          <circle cx="280" cy="95" r="4" fill={B.color} />
        </svg>
      </div>
    </div>
  );
}

window.CompareOptionA = CompareOptionA;
window.RegionPicker = RegionPicker;
window.KpiH2H = KpiH2H;
window.ChartCard = ChartCard;
