/* Area+Category Option B — エリア・プロファイル・ハブ
   - 上部: エリア・プロファイル ヒーロー (地図 + KPI + 主要属性)
   - その下: カテゴリ・ナビゲーション (横一列の大きなカード)
   - KPI セクション → チャートグリッド (3列)
   - 右サイドバー: 比較ツール + 市区町村 */

function AreaOptionB() {
  const [norm, setNorm] = React.useState("total");
  const [year, setYear] = React.useState("2024");

  return (
    <div className="page" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "都道府県一覧" },
          { label: AREA.name }, { label: "人口・世帯", current: true },
        ]} />
      </div>

      {/* ★ Area profile hero */}
      <div style={{ padding: "12px 24px 0" }}>
        <div className="card" style={{
          padding: 20, display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 24,
          alignItems: "center",
        }}>
          {/* Mini Japan */}
          <div style={{ position: "relative" }}>
            <JapanHighlight highlightCode={AREA.code} color={AREA.flagColor} />
          </div>
          {/* Identity */}
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
              都道府県プロファイル · {AREA.region}地方
            </div>
            <h1 className="h1" style={{ fontSize: 36, marginTop: 2 }}>
              <span style={{ color: AREA.flagColor }}>●</span> {AREA.name}
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 12 }}>
              {[
                ["総人口",     `${(AREA.population / 10000).toFixed(0)}万`, "人", `全国1位/47`],
                ["人口密度",   AREA.density.toLocaleString(),                "人/km²", `全国1位/47`],
                ["面積",       "2,194",                                       "km²",   `全国45位/47`],
                ["市区町村",   AREA.cities.length,                            "区市町村", null],
              ].map(([k, v, u, sub], i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600 }}>{k}</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>
                    {v}<span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>{u}</span>
                  </div>
                  {sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
                </div>
              ))}
            </div>
          </div>
          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="btn btn-primary">
              {React.cloneElement(Icons.External, { className: "icon" })}
              他県と比較
            </button>
            <button className="btn">
              {React.cloneElement(Icons.Bookmark, { className: "icon" })}
              この都道府県を保存
            </button>
            <button className="btn">
              {React.cloneElement(Icons.Share, { className: "icon" })}
              共有
            </button>
          </div>
        </div>
      </div>

      {/* ★ Category navigation */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{AREA.name}のデータをカテゴリで見る</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8 }}>
          {AREA_CATEGORIES.map((c) => (
            <button key={c.key} style={{
              cursor: "pointer", font: "inherit",
              padding: 12, borderRadius: 10,
              border: `1.5px solid ${c.active ? c.color : "var(--border)"}`,
              background: c.active ? "#fff" : "var(--bg)",
              boxShadow: c.active ? `0 6px 16px -8px ${c.color}55` : "var(--shadow-sm)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              position: "relative",
              textAlign: "center",
            }}>
              {c.active && (
                <span style={{ position: "absolute", top: -8, right: -8, fontSize: 9, fontWeight: 700, padding: "2px 6px", background: c.color, color: "#fff", borderRadius: 999 }}>表示中</span>
              )}
              <div style={{ fontSize: 20 }}>{c.icon}</div>
              <div style={{ fontSize: 11.5, fontWeight: c.active ? 700 : 500, color: c.active ? c.color : "var(--fg-2)", lineHeight: 1.3 }}>{c.name}</div>
              <div style={{ fontSize: 9.5, color: "var(--muted)" }}>{c.count}指標</div>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 className="h2" style={{ fontSize: 22 }}>{AREA_CATEGORIES.find(c => c.active).icon} 人口・世帯のデータ</h2>
          <span className="pill primary">28指標</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="seg">
            {[["total", "総数"], ["per_pop", "人口あたり"], ["per_area", "面積あたり"]].map(([k, lbl]) => (
              <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
            ))}
          </div>
          <div className="select" style={{ padding: "5px 10px" }}>
            <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={e => setYear(e.target.value)}>
              {["2024", "2023", "2022", "2020", "2015"].map(y => <option key={y}>{y}年</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm">
            {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
            CSV
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ padding: "12px 24px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {AREA_KPIS.map((k, i) => <AreaKpiCard key={i} k={k} size="lg" />)}
      </div>

      {/* Charts + sidebar */}
      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0 }}>
          <div className="h2" style={{ marginBottom: 10 }}>詳細チャート</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              "年齢階層別人口ピラミッド",
              "人口推移（1990-2024）",
              "世帯構成の変化",
              "全国順位の推移",
              "市区町村別人口分布",
              "自然増減 vs 社会増減",
            ].map((t, i) => (
              <div key={i} className="card">
                <div className="card-header" style={{ padding: "10px 14px" }}>
                  <div className="h3">{t}</div>
                  <button className="btn btn-sm btn-ghost">…</button>
                </div>
                <div style={{ padding: 14, height: 180, background: "var(--bg-subtle)", margin: 12, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)" }}>
                  [Chart: {t}]
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Compare CTA */}
          <div className="card" style={{ padding: 14, background: "linear-gradient(180deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div className="h3" style={{ color: "var(--primary)", marginBottom: 6 }}>🔍 他県と比較</div>
            <div className="muted" style={{ fontSize: 11.5, marginBottom: 10, lineHeight: 1.55 }}>
              {AREA.name} と他県のデータを並べて表示
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {AREA.neighbors.map(n => (
                <a key={n.code} href="#" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 10px", fontSize: 12,
                  background: "#fff", border: "1px solid var(--border)", borderRadius: 6,
                  color: "var(--fg)", textDecoration: "none",
                }}>
                  <span>{AREA.name} vs <strong>{n.name}</strong></span>
                  <span style={{ color: "var(--primary)" }}>→</span>
                </a>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              比較ツールで開く
            </button>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: "10px 14px" }}>
              <div className="h3">市区町村</div>
              <span className="pill">{AREA.cities.length}</span>
            </div>
            <div style={{ padding: 6, maxHeight: 240, overflow: "auto" }}>
              {AREA.cities.slice(0, 18).map(c => (
                <a key={c} href="#" style={{ padding: "4px 10px", fontSize: 11.5, color: "var(--fg-2)", textDecoration: "none", display: "block" }}>{c}</a>
              ))}
            </div>
          </div>

          <AdSlot height={250} />

          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg, #fef3c7, #fff)", borderColor: "#fde68a" }}>
            <div className="h3" style={{ marginBottom: 6 }}>🎁 ふるさと納税</div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>{AREA.name}の特産品で寄附</div>
            <button className="btn" style={{ width: "100%", justifyContent: "center" }}>返礼品を見る</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.AreaOptionB = AreaOptionB;
