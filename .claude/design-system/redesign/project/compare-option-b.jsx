/* Compare Option B — 巨大ヒーロー(地図 + KPI スコアカード)
   - 地図ハイライト + 大型KPIスコア表 + 「勝ち負け」要約
   - スポーツのスコアボード風で直感的 */

function CompareOptionB() {
  const [A, B] = COMPARE_REGIONS;
  const aWins = COMPARE_KPIS.filter(k => k.lowerBetter ? k.aVal < k.bVal : k.aVal > k.bVal).length;
  const bWins = COMPARE_KPIS.length - aWins;
  return (
    <div className="page" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "比較ツール" }, { label: COMPARE_CATEGORY.name, current: true }]} />
      </div>

      {/* HERO scoreboard */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: `linear-gradient(135deg, ${A.color} 0%, ${A.color} 45%, #0f172a 50%, ${B.color} 55%, ${B.color} 100%)`,
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 200px 1fr", gap: 24, alignItems: "center" }}>
            {/* A */}
            <div style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ opacity: 0.6 }}>A · {A.region}</div>
              <h1 style={{ fontSize: 44, fontWeight: 800, margin: "8px 0", letterSpacing: "-0.02em" }}>{A.name}</h1>
              <div className="mono" style={{ fontSize: 56, fontWeight: 800, opacity: 0.95 }}>{aWins}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{COMPARE_KPIS.length}指標中 リード</div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 14, fontSize: 11.5, opacity: 0.85 }}>
                <span>{(A.population / 10000).toFixed(0)}万人</span>
                <span>{A.area.toLocaleString()} km²</span>
              </div>
            </div>
            {/* Mini map */}
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 10, opacity: 0.7, textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{COMPARE_CATEGORY.icon} {COMPARE_CATEGORY.name}</div>
              <CompareJapanMini codeA={A.code} codeB={B.code} colorA="#fff" colorB="#fff" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9.5 }}>
                <span>● {A.name}</span><span>● {B.name}</span>
              </div>
            </div>
            {/* B */}
            <div style={{ textAlign: "center" }}>
              <div className="eyebrow" style={{ opacity: 0.6 }}>B · {B.region}</div>
              <h1 style={{ fontSize: 44, fontWeight: 800, margin: "8px 0", letterSpacing: "-0.02em" }}>{B.name}</h1>
              <div className="mono" style={{ fontSize: 56, fontWeight: 800, opacity: 0.95 }}>{bWins}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{COMPARE_KPIS.length}指標中 リード</div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 14, fontSize: 11.5, opacity: 0.85 }}>
                <span>{(B.population / 10000).toFixed(0)}万人</span>
                <span>{B.area.toLocaleString()} km²</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Region & category controls */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 10, alignItems: "center", maxWidth: 600 }}>
          <RegionPicker side="A" region={A} />
          <div style={{ textAlign: "center", fontWeight: 800, color: "var(--muted)" }}>VS</div>
          <RegionPicker side="B" region={B} />
        </div>
        <select className="select" style={{ padding: "8px 10px", fontSize: 13 }}>
          <option>カテゴリ: {COMPARE_CATEGORY.name}</option>
          {COMPARE_CATEGORIES.slice(1).map(c => <option key={c.key}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary">
          {React.cloneElement(Icons.Download, { className: "icon" })} CSV
        </button>
      </div>

      {/* KPI head-to-head */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="h2" style={{ marginBottom: 10 }}>📊 指標別の勝敗</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COMPARE_KPIS.map((k, i) => <KpiH2H key={i} k={k} A={A} B={B} />)}
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: "20px 24px 24px" }}>
        <div className="h2" style={{ marginBottom: 10 }}>チャート比較</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["年齢階層別人口", "人口推移", "世帯構成", "出生・死亡推移"].map((t, i) => (
            <ChartCard key={i} title={t} A={A} B={B} />
          ))}
        </div>
      </div>
    </div>
  );
}

window.CompareOptionB = CompareOptionB;
