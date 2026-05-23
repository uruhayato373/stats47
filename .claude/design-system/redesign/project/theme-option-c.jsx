/* Theme Option C — マップ中心 + 指標サイドナビ (PC Power-user)
   - 左: スクロール可能な指標ナビ (現在値+選択ハイライト)
   - 中央: 大きな地図 (フォーカス) + その下に時系列/分布
   - 右: 統計コントロール (単位/年度/CSV) + 都道府県セレクタ + データ・エクスポート
   - 上部に薄いテーマ説明ヘッダー */

function ThemeOptionC() {
  const [selectedIndicator, setSelectedIndicator] = React.useState("birth-rate");
  const [normalization, setNormalization] = React.useState("total");
  const [year, setYear] = React.useState("2024");
  const [pref, setPref] = React.useState("沖縄県");

  const ind = INDICATORS.find(i => i.key === selectedIndicator) || INDICATORS[0];

  return (
    <div className="page" style={{ background: "#f5f7fa" }}>
      {/* Compact top header */}
      <div style={{ padding: "12px 20px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "テーマ一覧" }, { label: THEME.title, current: true },
        ]} />
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="h1" style={{ fontSize: 24 }}>{THEME.title} <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>ダッシュボード</span></h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{THEME.totalIndicators}指標 · {THEME.source} · 更新 {THEME.lastUpdated}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn">
              {React.cloneElement(Icons.Info, { className: "icon" })}
              テーマ詳細
            </button>
            <button className="btn">
              {React.cloneElement(Icons.Share, { className: "icon" })}
              共有
            </button>
          </div>
        </div>
      </div>

      <div style={{
        padding: "14px 20px 24px",
        display: "grid", gridTemplateColumns: "240px 1fr 300px", gap: 14, alignItems: "flex-start",
      }}>
        {/* ★ Left indicator nav */}
        <aside style={{ position: "sticky", top: 14 }}>
          <div className="card">
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
              <div className="h3">指標を選ぶ</div>
              <span className="pill" style={{ marginLeft: "auto" }}>{THEME.totalIndicators}</span>
            </div>
            <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 2, maxHeight: 660, overflow: "auto" }}>
              {INDICATORS.map((i) => {
                const active = i.key === selectedIndicator;
                return (
                  <button key={i.key} onClick={() => setSelectedIndicator(i.key)} style={{
                    cursor: "pointer", font: "inherit", textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: 0,
                    background: active ? "var(--primary-50)" : "transparent",
                    display: "flex", alignItems: "center", gap: 10,
                    borderLeft: `3px solid ${active ? i.color : "transparent"}`,
                    transition: "background .12s",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? "var(--primary)" : "var(--fg)" }}>{i.title}</div>
                      <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>
                        1位 {i.top1} · <span className="mono">{i.top1Val}{i.unit}</span>
                      </div>
                    </div>
                    <Sparkline data={i.trend} color={i.color} w={40} h={18} fill={false} />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center map */}
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 16, height: 16, background: ind.color, borderRadius: 4, flexShrink: 0 }} />
                <div className="h2" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ind.title}</div>
                <span className="pill primary">{normalization === "total" ? "総数" : normalization === "per_pop" ? "人口あたり" : "面積あたり"}</span>
                <span className="pill">{year}年</span>
              </div>
              <MapLegend unit={ind.unit} theme={ind.color === "#dc2626" ? "amber" : "blue"} />
            </div>
            <div style={{ padding: 14, background: "linear-gradient(180deg, #fff, #fafbfc)" }}>
              <JapanMap height={520} />
            </div>
            <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>出典: {THEME.source}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="#" className="muted" style={{ fontSize: 11.5, textDecoration: "none" }}>📊 グラフで見る</a>
                <a href="#" className="muted" style={{ fontSize: 11.5, textDecoration: "none" }}>📋 表で見る</a>
                <a href="#" className="muted" style={{ fontSize: 11.5, textDecoration: "none" }}>🔗 共有</a>
              </div>
            </div>
          </div>

          {/* Time series + distribution */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card">
              <div className="card-header" style={{ padding: "12px 14px" }}>
                <div className="h3">時系列の推移 (全国)</div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <Sparkline data={ind.trend} color={ind.color} w={400} h={110} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginTop: 8 }}>
                  {["2019", "2020", "2021", "2022", "2023", "2024"].map(y => <span key={y}>{y}</span>)}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header" style={{ padding: "12px 14px" }}>
                <div className="h3">分布 (47都道府県)</div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                {/* simple distribution dots */}
                <svg viewBox="0 0 400 110" style={{ width: "100%", height: 110 }}>
                  <line x1="20" x2="380" y1="80" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                  {Array.from({ length: 47 }).map((_, i) => {
                    const x = 20 + (i / 46) * 360;
                    const y = 80 - Math.random() * 50 - 8;
                    return <circle key={i} cx={x} cy={y} r="3.5" fill={ind.color} fillOpacity="0.4" />;
                  })}
                  <text x="20" y="100" fontSize="9" fill="#6b7280">最小</text>
                  <text x="380" y="100" textAnchor="end" fontSize="9" fill="#6b7280">最大</text>
                </svg>
              </div>
            </div>
          </div>
        </main>

        {/* Right control + data panel */}
        <aside style={{ position: "sticky", top: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Controls */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">表示設定</div>
            </div>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>表示単位</div>
              <div className="seg" style={{ width: "100%" }}>
                <button className={"item" + (normalization === "total" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNormalization("total")}>総</button>
                <button className={"item" + (normalization === "per_pop" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNormalization("per_pop")}>/人口</button>
                <button className={"item" + (normalization === "per_area" ? " active" : "")} style={{ flex: 1, justifyContent: "center" }} onClick={() => setNormalization("per_area")}>/面積</button>
              </div>
            </div>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>年度</div>
              <select className="select" style={{ width: "100%", padding: "7px 10px" }} value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y}>{y}年</option>)}
              </select>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>集計範囲</div>
              <div className="seg" style={{ width: "100%" }}>
                <button className="item active" style={{ flex: 1, justifyContent: "center" }}>都道府県</button>
                <button className="item" style={{ flex: 1, justifyContent: "center" }}>市区町村</button>
              </div>
            </div>
          </div>

          {/* CSV CTA */}
          <div className="card" style={{ padding: 12, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
              <div className="h3" style={{ color: "var(--primary)" }}>データをエクスポート</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>
              「{ind.title}」CSV
            </button>
            <button className="btn" style={{ width: "100%", justifyContent: "center", marginBottom: 6 }}>
              テーマ全{THEME.totalIndicators}指標 CSV
            </button>
            <div className="muted" style={{ fontSize: 10.5, textAlign: "center" }}>クレジット表記すれば商用利用可</div>
          </div>

          {/* Selected pref */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">都道府県を比較</div>
            </div>
            <div style={{ padding: 8 }}>
              <PrefMini selected={pref} onSelect={setPref} rows={PREF_LIST.slice(0, 6)} />
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.ThemeOptionC = ThemeOptionC;
