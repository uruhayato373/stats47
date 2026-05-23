/* Theme Option A — 整理改善 (現行構造を踏襲)
   - h1 を 24→32px に, テーマメタを整理
   - 指標タブを横スクロール → 表示単位/年度/CSV を1本のツールバーに統合
   - 右パネル(都道府県統計)に都道府県セレクタを設置, KPI を読みやすく整理
   - 下部「指標一覧」カードに KPI とスパークラインを追加 (現行は表面的) */

function ThemeOptionA() {
  const [selectedIndicator, setSelectedIndicator] = React.useState("population");
  const [normalization, setNormalization] = React.useState("total");
  const [year, setYear] = React.useState("2024");
  const [pref, setPref] = React.useState("東京都");

  const ind = INDICATORS.find(i => i.key === selectedIndicator) || INDICATORS[0];

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "テーマ一覧" }, { label: THEME.title, current: true },
        ]} />
      </div>

      {/* Theme header */}
      <header style={{ padding: "10px 24px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill primary">テーマ</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{THEME.category}</span>
          </div>
          <h1 className="h1" style={{ fontSize: 30 }}>{THEME.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--muted)", maxWidth: 720, lineHeight: 1.65 }}>
            {THEME.description}
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 11.5, color: "var(--muted)" }}>
            <span>📊 {THEME.totalIndicators}指標</span>
            <span>🔄 最終更新: {THEME.lastUpdated}</span>
            <span>📂 出典: {THEME.source}</span>
          </div>
        </div>
      </header>

      {/* ★ Indicator tabs — scrollable but clearly grouped */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>表示する指標を選択</div>
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          scrollbarColor: "var(--border-strong) transparent",
        }}>
          {INDICATORS.map((i) => {
            const active = i.key === selectedIndicator;
            return (
              <button key={i.key} onClick={() => setSelectedIndicator(i.key)} style={{
                cursor: "pointer", font: "inherit",
                whiteSpace: "nowrap", flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${active ? i.color : "var(--border)"}`,
                background: active ? i.color : "#fff",
                color: active ? "#fff" : "var(--fg-2)",
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all .12s",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: active ? "#fff" : i.color, opacity: active ? 0.9 : 1,
                }} />
                {i.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ★ Unified toolbar */}
      <div style={{ padding: "12px 24px 0" }}>
        <div className="card" style={{ padding: "10px 14px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <ToolGrp label="表示単位">
            <div className="seg">
              {[
                ["total", "総数", Icons.Sigma],
                ["per_pop", "人口あたり", Icons.Users],
                ["per_area", "面積あたり", Icons.Area],
              ].map(([k, lbl, ic]) => (
                <button key={k} className={"item" + (normalization === k ? " active" : "")} onClick={() => setNormalization(k)}>
                  {React.cloneElement(ic, { className: "icon icon-sm" })}
                  {lbl}
                </button>
              ))}
            </div>
          </ToolGrp>
          <Sep />
          <ToolGrp label="年度">
            <div className="select" style={{ padding: "5px 10px" }}>
              {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
              <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y}>{y}年</option>)}
              </select>
            </div>
          </ToolGrp>
          <Sep />
          <ToolGrp label="集計範囲">
            <div className="seg">
              <button className="item active">都道府県</button>
              <button className="item">市区町村</button>
            </div>
          </ToolGrp>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary">
            {React.cloneElement(Icons.Download, { className: "icon" })}
            この指標を CSV
          </button>
          <button className="btn">
            {React.cloneElement(Icons.Download, { className: "icon" })}
            全指標まとめてCSV
          </button>
          <button className="btn" title="共有">
            {React.cloneElement(Icons.Share, { className: "icon" })}
          </button>
        </div>
      </div>

      {/* Main: left map + right stats panel */}
      <div style={{ padding: "16px 24px 0", display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, background: ind.color, borderRadius: 3 }} />
                <div className="h2">{ind.title}</div>
                <span className="pill primary">{normalization === "total" ? "総数" : normalization === "per_pop" ? "人口あたり" : "面積あたり"}</span>
                <span className="pill">{year}年</span>
              </div>
              <MapLegend unit={ind.unit} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", borderTop: "1px solid var(--border)" }}>
              <div className="jp-map" style={{ padding: 14, borderRight: "1px solid var(--border)" }}>
                <JapanMap height={420} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>順位 (上位10)</div>
                  <button className="btn btn-sm btn-ghost">47位まで</button>
                </div>
                <div style={{ padding: 8, overflow: "auto", maxHeight: 386 }}>
                  <PrefMini selected={pref} onSelect={setPref} />
                </div>
              </div>
            </div>
            <div className="card-footer">
              出典: {THEME.source} · データ年度: {year}年
            </div>
          </div>

          {/* Indicator overview grid */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">このテーマの指標一覧</div>
              <div className="muted" style={{ fontSize: 12 }}>{THEME.totalIndicators}指標</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {INDICATORS.slice(0, 8).map((i) => (
                <IndicatorCard key={i.key} ind={i} active={i.key === selectedIndicator} onClick={() => setSelectedIndicator(i.key)} />
              ))}
            </div>
          </section>
        </div>

        {/* Right stats panel */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">都道府県の統計</div>
            </div>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>選択中</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{pref}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>全国 1位 · {ind.title}</div>
            </div>
            <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <StatTile label="現在値" value="1,401" unit="万人" sub="2024年" color={ind.color} />
              <StatTile label="全国順位" value="1" unit="/47位" sub="前年同位" />
              <StatTile label="10年前比" value="+5.2" unit="%" sub="2014年比" color="var(--accent)" />
              <StatTile label="全国シェア" value="11.3" unit="%" />
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>2019〜2024の推移</div>
              <div style={{ background: "var(--bg-subtle)", padding: 8, borderRadius: 6 }}>
                <Sparkline data={ind.trend} color={ind.color} w={320} h={60} />
              </div>
            </div>
          </div>

          <RelatedRankingsCard items={INDICATORS.slice(0, 5).map(i => ({ key: i.key, title: i.title, unit: i.unit }))} />

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ToolGrp({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
      {children}
    </div>
  );
}
function Sep() { return <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />; }

window.ThemeOptionA = ThemeOptionA;
