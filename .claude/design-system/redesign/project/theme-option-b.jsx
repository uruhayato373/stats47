/* Theme Option B — KPI ヒーロー・ダッシュボード (Bold)
   - 上部に巨大な KPI カード行 (各指標が現在値+1位+スパークライン)
   - クリックで地図とパネルが切替 (タブの代替)
   - 右パネル: 都道府県プロファイル (選択した県の全指標を一覧)
   - CSV エクスポートはセクションごとに */

function ThemeOptionB() {
  const [selectedIndicator, setSelectedIndicator] = React.useState("aging-rate");
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

      <header style={{ padding: "10px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill primary">テーマ</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{THEME.category}</span>
          </div>
          <h1 className="h1" style={{ fontSize: 32 }}>{THEME.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--muted)", maxWidth: 720, lineHeight: 1.6 }}>
            {THEME.description}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="select">
            {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
            <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y}>{y}年</option>)}
            </select>
          </div>
          <button className="btn btn-primary">
            {React.cloneElement(Icons.Download, { className: "icon" })}
            全指標CSV
          </button>
        </div>
      </header>

      {/* ★ KPI card row — the new tab interaction */}
      <div style={{ padding: "0 24px" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">指標から選ぶ <span style={{ color: "var(--muted)", textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>· クリックして詳細表示</span></div>
          <div className="seg">
            <button className="item active">クリッカブル</button>
            <button className="item">スクロール</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {INDICATORS.slice(0, 12).map((i) => (
            <IndicatorCard key={i.key} ind={i} active={i.key === selectedIndicator} onClick={() => setSelectedIndicator(i.key)} />
          ))}
        </div>
      </div>

      {/* Sub-toolbar with normalization */}
      <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 14, background: ind.color, borderRadius: 4 }} />
          <div style={{ fontSize: 18, fontWeight: 700 }}>{ind.title}</div>
          <span className="muted" style={{ fontSize: 12 }}>· 単位 {ind.unit || "-"} · {year}年</span>
        </div>
        <div style={{ flex: 1 }} />
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
        <button className="btn btn-sm">
          {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
          {ind.title} を CSV
        </button>
      </div>

      <div style={{ padding: "12px 24px 0", display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "flex-start" }}>
        {/* Left: Map + table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {React.cloneElement(Icons.Map, { className: "icon icon-lg", style: { color: ind.color } })}
                <div className="h2">地図</div>
              </div>
              <MapLegend unit={ind.unit} />
            </div>
            <div className="jp-map" style={{ padding: 12 }}>
              <JapanMap height={420} />
            </div>
          </div>

          {/* Correlation hint card */}
          <div className="card" style={{ padding: 14, background: "var(--bg-subtle)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: "var(--accent)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              {React.cloneElement(Icons.Sparkle, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>「{ind.title}」と相関の強い指標</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                平均年齢 (r=0.92) · 死亡率 (r=0.86) · 年少人口比率 (r=−0.78)
              </div>
            </div>
            <a href="#" className="btn btn-sm">相関分析を見る →</a>
          </div>
        </div>

        {/* Right: Prefecture profile */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>都道府県プロファイル</div>
              <select className="select" style={{ width: "100%", padding: "8px 10px" }} value={pref} onChange={e => setPref(e.target.value)}>
                {PREF_LIST.map(p => <option key={p.name}>{p.name}</option>)}
              </select>
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{THEME.title} 全{THEME.totalIndicators}指標を表示</div>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4, maxHeight: 480, overflow: "auto" }}>
              {INDICATORS.slice(0, 10).map(i => (
                <div key={i.key} style={{
                  padding: "8px 10px", borderRadius: 6,
                  display: "grid", gridTemplateColumns: "1fr 90px 60px", alignItems: "center", gap: 8,
                  background: i.key === selectedIndicator ? "var(--primary-50)" : "transparent",
                  border: i.key === selectedIndicator ? "1px solid var(--primary-100)" : "1px solid transparent",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{i.title}</div>
                    <div className="muted" style={{ fontSize: 10.5 }}>1位 {i.top1}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, textAlign: "right" }}>{i.top1Val} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 10 }}>{i.unit}</span></div>
                  <Sparkline data={i.trend} color={i.color} w={56} h={20} />
                </div>
              ))}
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.ThemeOptionB = ThemeOptionB;
