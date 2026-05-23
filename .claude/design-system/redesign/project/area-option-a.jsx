/* Area+Category Option A — 整理改善 (低リスク)
   - h1 (text-lg) → 32px に, ヘッダーに area メタ情報追加
   - 現在のカテゴリと他カテゴリを切替えやすく (横一列のカテゴリタブ)
   - KPI セクションに正規化トグル+CSV+期間切替
   - 単一カラム → 2カラム (右に市区町村ナビ・関連エリア・広告) */

function AreaOptionA() {
  const [norm, setNorm] = React.useState("total");
  const [year, setYear] = React.useState("2024");

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "都道府県一覧" },
          { label: AREA.name }, { label: "人口・世帯", current: true },
        ]} />
      </div>

      {/* ★ Area header */}
      <header style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: AREA.flagColor, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 800, flexShrink: 0 }}>
            東京
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{AREA.region}地方 · 都道府県コード {AREA.code}</div>
            <h1 className="h1" style={{ fontSize: 32 }}>{AREA.name}の<span style={{ color: AREA.flagColor }}>人口・世帯</span></h1>
            <div style={{ marginTop: 6, display: "flex", gap: 14, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
              <span>👥 人口 {FMT.format(AREA.population)}人</span>
              <span>📐 面積 {AREA.area}</span>
              <span>📍 県庁所在地: {AREA.capital}</span>
              <span>📊 28指標</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">
            {React.cloneElement(Icons.Share, { className: "icon" })}
            共有
          </button>
          <button className="btn btn-primary">
            {React.cloneElement(Icons.External, { className: "icon" })}
            他県と比較
          </button>
        </div>
      </header>

      {/* ★ Category tabs (current page) */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{AREA.name}の他のカテゴリへ</div>
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
        }}>
          {AREA_CATEGORIES.map((c) => (
            <button key={c.key} style={{
              cursor: "pointer", font: "inherit",
              whiteSpace: "nowrap", flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 999,
              border: `1px solid ${c.active ? c.color : "var(--border)"}`,
              background: c.active ? c.color : "#fff",
              color: c.active ? "#fff" : "var(--fg-2)",
              fontSize: 12.5, fontWeight: c.active ? 600 : 500,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span>{c.icon}</span>
              {c.name}
              <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ★ Toolbar */}
      <div style={{ padding: "12px 24px 0" }}>
        <div className="card" style={{ padding: "10px 14px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <ToolG label="表示単位">
            <div className="seg">
              {[["total", "総数"], ["per_pop", "人口あたり"], ["per_area", "面積あたり"]].map(([k, lbl]) => (
                <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
              ))}
            </div>
          </ToolG>
          <Sep />
          <ToolG label="年度">
            <div className="select" style={{ padding: "5px 10px" }}>
              {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
              <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={e => setYear(e.target.value)}>
                {["2024", "2023", "2022", "2020", "2015"].map(y => <option key={y}>{y}年</option>)}
              </select>
            </div>
          </ToolG>
          <Sep />
          <ToolG label="比較対象">
            <div className="seg">
              <button className="item active">全国平均</button>
              <button className="item">関東平均</button>
              <button className="item">隣接県</button>
            </div>
          </ToolG>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary">
            {React.cloneElement(Icons.Download, { className: "icon" })}
            {AREA.name} 人口・世帯CSV
          </button>
        </div>
      </div>

      {/* Main + Sidebar */}
      <div style={{ padding: "16px 24px 0", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPI cards */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">{AREA.name}の主要指標</div>
              <span className="muted" style={{ fontSize: 12 }}>全国比較 · {year}年</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {AREA_KPIS.map((k, i) => <AreaKpiCard key={i} k={k} />)}
            </div>
          </section>

          {/* Charts placeholder */}
          <section>
            <div className="h2" style={{ marginBottom: 10 }}>チャートで見る</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["年齢階層別人口", "人口推移（10年）", "世帯構成", "出生・死亡（自然増減）"].map((t, i) => (
                <div key={i} className="card">
                  <div className="card-header" style={{ padding: "10px 14px" }}>
                    <div className="h3">{t}</div>
                    <button className="btn btn-sm btn-ghost">
                      {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
                    </button>
                  </div>
                  <div style={{ padding: 16, background: "var(--bg-subtle)", margin: 12, borderRadius: 8, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
                    [Chart placeholder: {t}]
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Area's ranking in this category */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">{AREA.name}の全国順位</div>
              <span className="muted" style={{ fontSize: 12 }}>{AREA_RANKINGS_IN_CATEGORY.length}指標</span>
            </div>
            <div className="card">
              <table className="rk">
                <thead>
                  <tr>
                    <th>指標</th>
                    <th>全国順位</th>
                    <th style={{ textAlign: "right" }}>{AREA.name}の値</th>
                    <th style={{ textAlign: "right" }}>前年比</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {AREA_RANKINGS_IN_CATEGORY.map((r, i) => {
                    const isTop = r.rank <= 5;
                    const isBottom = r.rank >= 43;
                    return (
                      <tr key={i}>
                        <td>
                          <a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.title}</a>
                        </td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                            background: isTop ? "#fef3c7" : isBottom ? "#fee2e2" : "var(--bg-muted)",
                            color: isTop ? "#92400e" : isBottom ? "#991b1b" : "var(--muted)",
                          }}>
                            {isTop && "👑 "}{r.rank}位 / 47
                          </span>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{r.value}</td>
                        <td className="mono" style={{ textAlign: "right", color: r.change.startsWith("-") ? "var(--danger)" : r.change.startsWith("+") ? "var(--accent)" : "var(--muted)", fontWeight: 500, fontSize: 12 }}>{r.change}</td>
                        <td style={{ textAlign: "right" }}><a href="#" className="btn btn-sm btn-ghost">ランキング →</a></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">{AREA.name}の市区町村</div>
              <span className="pill">{AREA.cities.length}</span>
            </div>
            <div style={{ padding: 6, maxHeight: 280, overflow: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {AREA.cities.slice(0, 20).map(c => (
                  <a key={c} href="#" style={{
                    padding: "5px 10px", fontSize: 11.5, borderRadius: 4,
                    color: "var(--fg-2)", textDecoration: "none",
                  }}>{c}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">隣接する都道府県</div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {AREA.neighbors.map(n => <a key={n.code} href="#"><span>{n.name}</span><span className="meta">→</span></a>)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>

          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg, #fef3c7, #fff)", borderColor: "#fde68a" }}>
            <div className="h3" style={{ marginBottom: 6 }}>🎁 ふるさと納税</div>
            <div className="muted" style={{ fontSize: 11.5, marginBottom: 8, lineHeight: 1.5 }}>
              {AREA.name}の特産品で寄附できる返礼品をチェック
            </div>
            <button className="btn" style={{ width: "100%", justifyContent: "center" }}>返礼品を見る →</button>
          </div>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ToolG({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
      {children}
    </div>
  );
}
function Sep() { return <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />; }

window.AreaOptionA = AreaOptionA;
