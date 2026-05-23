/* Option A — 整理された統合ツールバー
   全コントロールを1本の明確なツールバーに集約。CSVも文言付きボタンに昇格。
   既存スタイルを尊重したミニマルな改善。 */

function OptionA() {
  const [unit, setUnit] = React.useState("total"); // total / per_pop / per_area
  const [area, setArea] = React.useState("pref");
  const [year, setYear] = React.useState("2024");
  const [view, setView] = React.useState("split"); // split / map / table

  const unitLabel =
    unit === "total" ? "総数" :
    unit === "per_pop" ? "人口千人あたり" : "面積1km²あたり";
  const valueUnit =
    unit === "total" ? "人" :
    unit === "per_pop" ? "‰" : "人/km²";

  return (
    <div className="page">
      <div style={{ padding: "16px 24px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ランキング" },
          { label: "人口・世帯" }, { label: "総人口", current: true },
        ]} />
      </div>

      {/* Title */}
      <header style={{ padding: "10px 24px 0" }}>
        <div className="row" style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 className="h1">総人口ランキング</h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 14 }}>
              <span>📅 データ年度: 2024年</span>
              <span>🔄 最終更新: 2025-04-12</span>
              <span>📊 出典: 総務省統計局「人口推計」</span>
            </div>
          </div>
        </div>
      </header>

      {/* ★ The redesigned toolbar */}
      <div style={{ padding: "14px 24px 0" }}>
        <div className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "stretch", gap: 18, flexWrap: "wrap" }}>
          {/* Group: 単位 */}
          <ToolbarGroup label="表示単位" hint="人口・面積で正規化">
            <div className="seg">
              {[
                ["total", "総数", Icons.Sigma],
                ["per_pop", "人口あたり", Icons.Users],
                ["per_area", "面積あたり", Icons.Area],
              ].map(([k, lbl, ic]) => (
                <button key={k} className={"item" + (unit === k ? " active" : "")} onClick={() => setUnit(k)}>
                  {React.cloneElement(ic, { className: "icon icon-sm" })}
                  {lbl}
                </button>
              ))}
            </div>
          </ToolbarGroup>

          <Divider />

          <ToolbarGroup label="集計範囲">
            <div className="seg">
              <button className={"item" + (area === "pref" ? " active" : "")} onClick={() => setArea("pref")}>都道府県</button>
              <button className={"item" + (area === "city" ? " active" : "")} onClick={() => setArea("city")}>市区町村</button>
            </div>
          </ToolbarGroup>

          <Divider />

          <ToolbarGroup label="年度">
            <div className="select">
              {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
              <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={(e) => setYear(e.target.value)}>
                {["2024", "2023", "2022", "2020", "2015", "2010"].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </ToolbarGroup>

          <div style={{ flex: 1 }} />

          <ToolbarGroup label="表示" align="end">
            <div className="seg">
              <button className={"item" + (view === "split" ? " active" : "")} onClick={() => setView("split")}>
                {React.cloneElement(Icons.Layer, { className: "icon icon-sm" })}
                分割
              </button>
              <button className={"item" + (view === "map" ? " active" : "")} onClick={() => setView("map")}>
                {React.cloneElement(Icons.Map, { className: "icon icon-sm" })}
                地図
              </button>
              <button className={"item" + (view === "table" ? " active" : "")} onClick={() => setView("table")}>
                {React.cloneElement(Icons.Table, { className: "icon icon-sm" })}
                表
              </button>
            </div>
          </ToolbarGroup>

          <Divider />

          <ToolbarGroup label="エクスポート" align="end">
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-primary">
                {React.cloneElement(Icons.Download, { className: "icon" })}
                CSV
              </button>
              <button className="btn" title="共有">
                {React.cloneElement(Icons.Share, { className: "icon" })}
              </button>
            </div>
          </ToolbarGroup>
        </div>
      </div>

      {/* Map + Table */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 16 }}>
        <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {React.cloneElement(Icons.Map, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
                  <div className="h2">地図</div>
                  <span className="pill primary">{unitLabel}</span>
                </div>
                <MapLegend unit={valueUnit} />
              </div>
              <div className="card-body" style={{ padding: 8 }}>
                <div className="jp-map" style={{ padding: 12 }}>
                  <JapanMap height={380} />
                </div>
              </div>
              <div className="card-footer">出典: 総務省統計局 · 推計年: 2024年10月1日時点</div>
            </div>

            <div className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {React.cloneElement(Icons.Table, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
                  <div className="h2">順位表</div>
                  <span className="pill">47件</span>
                </div>
                <button className="btn btn-sm btn-ghost">
                  {React.cloneElement(Icons.Search, { className: "icon icon-sm" })}
                  絞り込み
                </button>
              </div>
              <div style={{ maxHeight: 412, overflow: "auto" }}>
                <RankingTable rows={TOP_DATA} unit={valueUnit === "‰" ? "人" : valueUnit} />
              </div>
            </div>
          </div>

          <AdSlot height={120} label="広告（コンテンツ後）" />
        </div>

        {/* Sidebar */}
        <aside style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <RelatedSidebar>
            <AdSlot height={250} />
            <div className="card">
              <div className="card-header"><div className="h3">関連記事</div></div>
              <div className="card-body" style={{ padding: 6 }}>
                <div className="side-list">
                  {["人口減少と地方創生", "東京一極集中の現状", "市区町村別人口の長期推移"].map((t, i) => (
                    <a key={i} href="#"><span>{t}</span></a>
                  ))}
                </div>
              </div>
            </div>
          </RelatedSidebar>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ToolbarGroup({ label, hint, children, align = "start" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: align === "end" ? "flex-end" : "flex-start" }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      {children}
      {hint && <div className="muted" style={{ fontSize: 10.5 }}>{hint}</div>}
    </div>
  );
}
function Divider() {
  return <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />;
}

window.OptionA = OptionA;
